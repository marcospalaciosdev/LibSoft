import { app, safeStorage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const AUTH_SESSION_FILE = 'auth-session.bin';

/**
 * Obtiene la ruta del archivo de sesión autenticada
 */
function getAuthSessionPath(): string {
	return path.join(app.getPath('userData'), AUTH_SESSION_FILE);
}

/**
 * Guarda la sesión de autenticación de forma segura en Electron
 */
export function saveAuthSession(session: { token: string; user: unknown }): void {
	if (!safeStorage.isEncryptionAvailable()) {
		throw new Error('El almacenamiento seguro de Electron no está disponible.');
	}

	const encryptedSession = safeStorage.encryptString(JSON.stringify(session));
	fs.writeFileSync(getAuthSessionPath(), encryptedSession);
	console.log('[AUTH] Sesión guardada de forma segura');
}

/**
 * Recupera la sesión de autenticación guardada
 */
export function getAuthSession(): { token: string; user: unknown } | null {
	const sessionPath = getAuthSessionPath();

	if (!safeStorage.isEncryptionAvailable() || !fs.existsSync(sessionPath)) {
		return null;
	}

	try {
		const encryptedSession = fs.readFileSync(sessionPath);
		return JSON.parse(safeStorage.decryptString(encryptedSession));
	} catch (error) {
		console.error('[AUTH] Error al recuperar la sesión segura:', error);
		return null;
	}
}

/**
 * Limpia la sesión de autenticación
 */
export function clearAuthSession(): void {
	const sessionPath = getAuthSessionPath();
	if (fs.existsSync(sessionPath)) {
		fs.unlinkSync(sessionPath);
		console.log('[AUTH] Sesión limpiada');
	}
}
