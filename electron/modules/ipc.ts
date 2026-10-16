import { ipcMain, dialog, Notification, shell, BrowserWindow } from 'electron';
import * as path from 'path';
import {
	saveAuthSession,
	getAuthSession,
	clearAuthSession
} from './auth';
import {
	exportBackup,
	importBackup,
	readBackupHistory,
	getDefaultBackupRoute,
	setDefaultBackupRoute,
	getBackupConfig,
	saveBackupConfig,
	initAutoBackupScheduler
} from './backup';

/**
 * Registra todos los manejadores IPC de la aplicación
 */
export function registerIpcHandlers(
	dbConfig: {
		user: string;
		password: string;
		host: string;
		port: string;
		dbName: string;
	},
	isProd: boolean,
	getMainWindow: () => BrowserWindow | null
): void {
	// ── Inicializar Scheduler de Backups Automáticos ─────────
	initAutoBackupScheduler(dbConfig, isProd);

	// ── Configuración de Backups ─────────────────────────────
	ipcMain.handle('get-backup-config', async () => {
		return getBackupConfig();
	});

	ipcMain.handle('save-backup-config', async (_event, config: any) => {
		try {
			return saveBackupConfig(config);
		} catch (error: any) {
			throw new Error(error.message || 'Error al guardar la configuración de backup');
		}
	});

	ipcMain.handle('get-default-backup-path', async () => {
		return getDefaultBackupRoute();
	});

	ipcMain.handle('set-default-backup-path', async (_event, route: string) => {
		try {
			return await setDefaultBackupRoute(route);
		} catch (error: any) {
			throw new Error(error.message || 'Error al guardar la ruta de backup');
		}
	});

	ipcMain.handle('save-auth-session', (_event, session: { token: string; user: unknown }) => {
		try {
			saveAuthSession(session);
		} catch (error: any) {
			throw new Error(error.message || 'Error al guardar sesión');
		}
	});

	ipcMain.handle('get-auth-session', () => {
		return getAuthSession();
	});

	ipcMain.handle('clear-auth-session', () => {
		clearAuthSession();
	});

	// ── Backups ──────────────────────────────────────────────
	ipcMain.handle('export-backup', async (_event, folderPath: string, userPassword: string) => {
		try {
			return await exportBackup(folderPath, userPassword, dbConfig, isProd);
		} catch (error: any) {
			throw new Error(error.message || 'Error al exportar backup');
		}
	});

	ipcMain.handle('import-backup', async (_event, filePath: string, userPassword: string) => {
		try {
			return await importBackup(filePath, userPassword, dbConfig, isProd);
		} catch (error: any) {
			throw new Error(error.message || 'Error al importar backup');
		}
	});

	ipcMain.handle('get-backup-history', async () => {
		return readBackupHistory();
	});

	// ── Notificaciones ───────────────────────────────────────
	ipcMain.on('show-notification', (_event, title: string, body: string) => {
		new Notification({
			title,
			body
		}).show();
	});

	// ── Diálogos de archivo ──────────────────────────────────
	ipcMain.handle('select-folder', async () => {
		const mainWindow = getMainWindow();
		if (!mainWindow) return null;

		const result = await dialog.showOpenDialog(mainWindow, {
			properties: ['openDirectory'],
			title: 'Seleccionar carpeta para el backup'
		});

		if (result.canceled || result.filePaths.length === 0) return null;
		return result.filePaths[0];
	});

	ipcMain.handle('select-lsbak-file', async () => {
		const mainWindow = getMainWindow();
		if (!mainWindow) return null;

		const result = await dialog.showOpenDialog(mainWindow, {
			properties: ['openFile'],
			title: 'Seleccionar archivo de backup',
			filters: [
				{ name: 'Libsoft Backups', extensions: ['lsbak'] },
				{ name: 'Todos los archivos', extensions: ['*'] }
			]
		});

		if (result.canceled || result.filePaths.length === 0) return null;
		return result.filePaths[0];
	});

	// ── Explorador de archivos ───────────────────────────────
	ipcMain.handle('reveal-in-file-explorer', (_event, filePath: string) => {
		if (!filePath) return;

		const safePath = path.resolve(filePath);
		shell.showItemInFolder(safePath);
	});

	console.log('[IPC] Manejadores IPC registrados');
}
