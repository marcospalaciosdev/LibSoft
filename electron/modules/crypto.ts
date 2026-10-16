import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import * as fs from 'fs';

const SALT_LEN = 16;
const IV_LEN = 12;
const TAG_LEN = 16;
const HEADER_LEN = SALT_LEN + IV_LEN;

/**
 * Deriva una clave de 32 bytes (256 bits) usando scrypt
 */
export function deriveKey(password: string, salt: Buffer): Buffer {
	return scryptSync(password, salt, 32);
}

/**
 * Cifra un archivo en su misma ruta usando AES-256-GCM.
 * Estructura resultante: [salt 16B][iv 12B][datos cifrados][authTag 16B]
 */
export function encryptFileInPlace(filePath: string, userPassword: string): Promise<void> {
	return new Promise((resolve, reject) => {
		try {
			const salt = randomBytes(SALT_LEN);
			const iv = randomBytes(IV_LEN);
			const key = deriveKey(userPassword, salt);
			const cipher = createCipheriv('aes-256-gcm', key, iv);

			const tempEncryptedPath = `${filePath}.enc`;
			const input = fs.createReadStream(filePath);
			const output = fs.createWriteStream(tempEncryptedPath);

			output.write(salt);
			output.write(iv);

			input.pipe(cipher).pipe(output, { end: false });

			cipher.on('end', () => {
				const authTag = cipher.getAuthTag();
				output.write(authTag);
				output.end();
			});

			output.on('finish', () => {
				try {
					fs.unlinkSync(filePath);
					fs.renameSync(tempEncryptedPath, filePath);
					resolve();
				} catch (err) {
					reject(err);
				}
			});

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
 * Descifra un archivo .lsbak cifrado a un archivo temporal .tmp.
 * @returns Ruta al archivo temporal descifrado.
 */
export function decryptFileToTemp(encryptedFilePath: string, userPassword: string): Promise<string> {
	return new Promise((resolve, reject) => {
		try {
			const fileBuffer = fs.readFileSync(encryptedFilePath);
			const minSize = HEADER_LEN + TAG_LEN + 1;

			if (fileBuffer.length < minSize) {
				return reject(new Error('El archivo de backup está corrupto o es inválido.'));
			}

			const salt = fileBuffer.subarray(0, SALT_LEN);
			const iv = fileBuffer.subarray(SALT_LEN, HEADER_LEN);
			const authTag = fileBuffer.subarray(fileBuffer.length - TAG_LEN);
			const encryptedData = fileBuffer.subarray(HEADER_LEN, fileBuffer.length - TAG_LEN);

			const key = deriveKey(userPassword, salt);
			const decipher = createDecipheriv('aes-256-gcm', key, iv);

			decipher.setAuthTag(authTag);

			const tempDecryptedPath = `${encryptedFilePath}.tmp`;

			try {
				const decrypted = Buffer.concat([
					decipher.update(encryptedData),
					decipher.final(),
				]);
				fs.writeFileSync(tempDecryptedPath, decrypted);
				resolve(tempDecryptedPath);
			} catch {
				reject(new Error('Contraseña incorrecta o archivo de backup corrupto.'));
			}
		} catch (err: any) {
			reject(err);
		}
	});
}
