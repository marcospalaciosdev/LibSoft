import { app, safeStorage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Auth Session Module
 *
 * Handles secure persistence of the user's authentication session using
 * Electron's safeStorage API, which encrypts data with OS-level key storage
 * (e.g. Keychain on macOS, DPAPI on Windows).
 *
 * The session is stored as an encrypted binary file in the app's userData directory.
 */

// Name of the encrypted session file stored in userData
const AUTH_SESSION_FILE = 'auth-session.bin';

/**
 * Returns the absolute path to the encrypted session file.
 */
function getAuthSessionPath(): string {
	return path.join(app.getPath('userData'), AUTH_SESSION_FILE);
}

/**
 * Encrypts and saves the user's auth session to disk.
 * Throws if OS-level encryption is not available.
 *
 * @param session - Object containing the JWT token and user data.
 */
export function saveAuthSession(session: { token: string; user: unknown }): void {
	if (!safeStorage.isEncryptionAvailable()) {
		throw new Error('Electron safeStorage is not available on this system.');
	}

	const encryptedSession = safeStorage.encryptString(JSON.stringify(session));
	fs.writeFileSync(getAuthSessionPath(), encryptedSession);
	console.log('[AUTH] Session saved securely');
}

/**
 * Reads and decrypts the stored auth session from disk.
 * Returns null if encryption is unavailable or the file does not exist.
 */
export function getAuthSession(): { token: string; user: unknown } | null {
	const sessionPath = getAuthSessionPath();

	// Return null early if encryption is unavailable or no session file exists
	if (!safeStorage.isEncryptionAvailable() || !fs.existsSync(sessionPath)) {
		return null;
	}

	try {
		const encryptedSession = fs.readFileSync(sessionPath);
		return JSON.parse(safeStorage.decryptString(encryptedSession));
	} catch (error) {
		console.error('[AUTH] Failed to retrieve secure session:', error);
		return null;
	}
}

/**
 * Deletes the stored auth session file from disk.
 * Safe to call even if no session file exists.
 */
export function clearAuthSession(): void {
	const sessionPath = getAuthSessionPath();
	if (fs.existsSync(sessionPath)) {
		fs.unlinkSync(sessionPath);
		console.log('[AUTH] Session cleared');
	}
}
