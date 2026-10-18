import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import * as fs from 'fs';

/**
 * Crypto Module
 *
 * Provides AES-256-GCM encryption and decryption for backup files.
 *
 * Encrypted file format:
 *   [ salt (16 bytes) ][ IV (12 bytes) ][ ciphertext (variable) ][ authTag (16 bytes) ]
 *
 * - salt: random bytes used for key derivation (different per file)
 * - IV (Initialization Vector): random nonce for AES-GCM
 * - authTag: GCM authentication tag for integrity verification
 */

const SALT_LEN = 16;   // scrypt salt length in bytes
const IV_LEN = 12;     // AES-GCM IV/nonce length in bytes
const TAG_LEN = 16;    // GCM authentication tag length in bytes
const HEADER_LEN = SALT_LEN + IV_LEN; // Total header size at the start of each file

/**
 * Derives a 256-bit (32-byte) encryption key from a password and salt
 * using Node's scrypt KDF (Key Derivation Function).
 *
 * @param password - The user-provided password.
 * @param salt - A random salt buffer (must match the one stored in the file header).
 * @returns A 32-byte Buffer suitable for use as an AES-256 key.
 */
export function deriveKey(password: string, salt: Buffer): Buffer {
	return scryptSync(password, salt, 32);
}

/**
 * Encrypts a file in-place using AES-256-GCM.
 *
 * The original file is read, encrypted, and replaced with the encrypted version.
 * A temporary `.enc` file is written first to avoid data loss on failure.
 *
 * Output file structure: [salt 16B][iv 12B][encrypted data][authTag 16B]
 *
 * @param filePath - Path to the plaintext file to encrypt.
 * @param userPassword - Password used to derive the encryption key.
 */
export function encryptFileInPlace(filePath: string, userPassword: string): Promise<void> {
	return new Promise((resolve, reject) => {
		try {
			// Generate a unique random salt and IV for this encryption
			const salt = randomBytes(SALT_LEN);
			const iv = randomBytes(IV_LEN);
			const key = deriveKey(userPassword, salt);
			const cipher = createCipheriv('aes-256-gcm', key, iv);

			const tempEncryptedPath = `${filePath}.enc`;
			const input = fs.createReadStream(filePath);
			const output = fs.createWriteStream(tempEncryptedPath);

			// Write header: salt + IV before the encrypted data
			output.write(salt);
			output.write(iv);

			// Pipe plaintext through the cipher into the output file
			input.pipe(cipher).pipe(output, { end: false });

			// Once the cipher finishes, append the GCM authentication tag
			cipher.on('end', () => {
				const authTag = cipher.getAuthTag();
				output.write(authTag);
				output.end();
			});

			// On success: replace the original file with the encrypted version
			output.on('finish', () => {
				try {
					fs.unlinkSync(filePath);
					fs.renameSync(tempEncryptedPath, filePath);
					resolve();
				} catch (err) {
					reject(err);
				}
			});

			// On write error: clean up the incomplete temp file
			output.on('error', (err) => {
				try {
					fs.unlinkSync(tempEncryptedPath);
				} catch { }
				reject(err);
			});

			input.on('error', reject);
			cipher.on('error', reject);
		} catch (err) {
			reject(err);
		}
	});
}

/**
 * Decrypts an AES-256-GCM encrypted backup file to a temporary `.tmp` file.
 *
 * Reads the salt and IV from the file header, derives the key from the password,
 * and decrypts the ciphertext. The GCM auth tag is verified automatically —
 * if verification fails, the password is wrong or the file is corrupt.
 *
 * @param encryptedFilePath - Path to the encrypted `.lsbak` file.
 * @param userPassword - The password used during encryption.
 * @returns The path to the temporary decrypted file.
 */
export function decryptFileToTemp(encryptedFilePath: string, userPassword: string): Promise<string> {
	return new Promise((resolve, reject) => {
		try {
			const fileBuffer = fs.readFileSync(encryptedFilePath);

			// Minimum valid size: header (salt + IV) + at least 1 byte of data + authTag
			const minSize = HEADER_LEN + TAG_LEN + 1;
			if (fileBuffer.length < minSize) {
				return reject(new Error('The backup file is corrupted or invalid.'));
			}

			// Extract header fields from the beginning of the file
			const salt = fileBuffer.subarray(0, SALT_LEN);
			const iv = fileBuffer.subarray(SALT_LEN, HEADER_LEN);

			// Extract the GCM auth tag from the end of the file
			const authTag = fileBuffer.subarray(fileBuffer.length - TAG_LEN);

			// Everything between the header and the auth tag is encrypted data
			const encryptedData = fileBuffer.subarray(HEADER_LEN, fileBuffer.length - TAG_LEN);

			const key = deriveKey(userPassword, salt);
			const decipher = createDecipheriv('aes-256-gcm', key, iv);

			// Set the auth tag so GCM can verify data integrity on final()
			decipher.setAuthTag(authTag);

			const tempDecryptedPath = `${encryptedFilePath}.tmp`;

			try {
				// Decrypt and write to a temporary file
				const decrypted = Buffer.concat([
					decipher.update(encryptedData),
					decipher.final(), // Throws here if password is wrong or data is tampered
				]);
				fs.writeFileSync(tempDecryptedPath, decrypted);
				resolve(tempDecryptedPath);
			} catch {
				// GCM auth tag mismatch — wrong password or corrupted file
				reject(new Error('Incorrect password or corrupted backup file.'));
			}
		} catch (err: any) {
			reject(err);
		}
	});
}
