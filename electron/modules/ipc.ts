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
 * IPC Module
 *
 * Registers all IPC (Inter-Process Communication) handlers for the application.
 * Each handler bridges a frontend request (via window.electronAPI) to a
 * main-process function.
 *
 * Grouped by domain:
 *  - Backup configuration
 *  - Auth session
 *  - Backup export/import
 *  - Notifications
 *  - File dialogs
 *  - File explorer utilities
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
	// ── Auto-backup scheduler ────────────────────────────────────
	// Initialize the scheduler immediately so it can run on startup if enabled
	initAutoBackupScheduler(dbConfig, isProd);

	// ── Backup configuration ─────────────────────────────────────
	ipcMain.handle('get-backup-config', async () => {
		return getBackupConfig();
	});

	ipcMain.handle('save-backup-config', async (_event, config: any) => {
		try {
			return saveBackupConfig(config);
		} catch (error: any) {
			throw new Error(error.message || 'Failed to save backup configuration');
		}
	});

	ipcMain.handle('get-default-backup-path', async () => {
		return getDefaultBackupRoute();
	});

	ipcMain.handle('set-default-backup-path', async (_event, route: string) => {
		try {
			return await setDefaultBackupRoute(route);
		} catch (error: any) {
			throw new Error(error.message || 'Failed to save backup path');
		}
	});

	// ── Auth session ─────────────────────────────────────────────
	ipcMain.handle('save-auth-session', (_event, session: { token: string; user: unknown }) => {
		try {
			saveAuthSession(session);
		} catch (error: any) {
			throw new Error(error.message || 'Failed to save auth session');
		}
	});

	ipcMain.handle('get-auth-session', () => {
		return getAuthSession();
	});

	ipcMain.handle('clear-auth-session', () => {
		clearAuthSession();
	});

	// ── Backup export / import ───────────────────────────────────
	ipcMain.handle('export-backup', async (_event, folderPath: string, userPassword: string) => {
		try {
			return await exportBackup(folderPath, userPassword, dbConfig, isProd);
		} catch (error: any) {
			throw new Error(error.message || 'Failed to export backup');
		}
	});

	ipcMain.handle('import-backup', async (_event, filePath: string, userPassword: string) => {
		try {
			return await importBackup(filePath, userPassword, dbConfig, isProd);
		} catch (error: any) {
			throw new Error(error.message || 'Failed to import backup');
		}
	});

	ipcMain.handle('get-backup-history', async () => {
		return readBackupHistory();
	});

	// ── Notifications ────────────────────────────────────────────
	ipcMain.on('show-notification', (_event, title: string, body: string) => {
		new Notification({
			title,
			body
		}).show();
	});

	// ── File dialogs ─────────────────────────────────────────────
	ipcMain.handle('select-folder', async () => {
		const mainWindow = getMainWindow();
		if (!mainWindow) return null;

		const result = await dialog.showOpenDialog(mainWindow, {
			properties: ['openDirectory'],
			title: 'Select backup destination folder'
		});

		if (result.canceled || result.filePaths.length === 0) return null;
		return result.filePaths[0];
	});

	ipcMain.handle('select-lsbak-file', async () => {
		const mainWindow = getMainWindow();
		if (!mainWindow) return null;

		const result = await dialog.showOpenDialog(mainWindow, {
			properties: ['openFile'],
			title: 'Select backup file',
			filters: [
				{ name: 'Libsoft Backups', extensions: ['lsbak'] },
				{ name: 'All Files', extensions: ['*'] }
			]
		});

		if (result.canceled || result.filePaths.length === 0) return null;
		return result.filePaths[0];
	});

	// ── File explorer ────────────────────────────────────────────
	ipcMain.handle('reveal-in-file-explorer', (_event, filePath: string) => {
		if (!filePath) return;

		// Resolve to an absolute, normalized path before passing to the shell
		const safePath = path.resolve(filePath);
		shell.showItemInFolder(safePath);
	});

	console.log('[IPC] IPC handlers registered');
}
