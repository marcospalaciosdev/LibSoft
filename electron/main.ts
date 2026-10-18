/**
 * LibSoft - Electron Main Process
 *
 * Entry point for the desktop application.
 * Manages:
 * - Application lifecycle (ready, quit, etc.)
 * - Embedded PostgreSQL initialization (in production)
 * - Main window creation
 * - IPC handler registration
 * - Backend server initialization
 */

import { app, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// ── Internal modules ──────────────────────────────────────────
import { setupPostgresEnv, startEmbeddedPostgres, stopEmbeddedPostgres, getPostgresConfig } from './modules/postgres';
import { createWindow, getMainWindow } from './modules/window';
import { registerIpcHandlers } from './modules/ipc';

// ── Global configuration ─────────────────────────────────────
process.env.ELECTRON_RUN = 'true';

const IS_PROD = app.isPackaged;
const isDev = !IS_PROD;

console.log(`[APP] Starting in ${IS_PROD ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

// ── Load environment variables ───────────────────────────────
if (isDev) {
	const backendEnvPath = path.join(__dirname, '..', '..', 'backend', '.env');
	const result = dotenv.config({ path: backendEnvPath });
	if (result.error) {
		console.warn('[APP] Could not load backend/.env:', result.error.message);
	}
}
setupPostgresEnv();

// ── Lifecycle events ─────────────────────────────────────────

/**
 * Event: Application is ready
 * Executes the full initialization sequence
 */
app.on('ready', async () => {
	try {
		console.log('[APP] Ready event fired');

		if (IS_PROD) {
			console.log('[APP] Starting embedded PostgreSQL...');
			await startEmbeddedPostgres();
		}

		const pgConfig = getPostgresConfig();
		const dbConfig = {
			user: process.env.DB_USER || pgConfig.user,
			password: process.env.DB_PASSWORD || pgConfig.password,
			host: process.env.DB_HOST || pgConfig.host,
			port: process.env.DB_PORT || String(pgConfig.port),
			dbName: process.env.DB_NAME || pgConfig.dbName
		};

		console.log('[APP] Database configuration:', {
			...dbConfig,
			password: '***'
		});

		registerIpcHandlers(dbConfig, IS_PROD, getMainWindow);

		console.log('[APP] Starting backend server...');
		await startBackendServer(isDev);

		console.log('[APP] Creating main window...');
		await createWindow(isDev);

		console.log('[APP] Application started successfully');
	} catch (err: any) {
		const errMsg = err?.message || String(err);
		console.error('[APP] Fatal error during startup:', errMsg);
		dialog.showErrorBox('Error starting the application', errMsg);
		app.quit();
	}
});

/**
 * Event: All windows were closed
 * On macOS, applications remain active until explicitly quit
 */
app.on('window-all-closed', () => {
	console.log('[APP] All windows were closed');
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

/**
 * Event: Application is about to quit
 * Cleans up resources before closing
 */
app.on('will-quit', () => {
	console.log('[APP] Application closing, cleaning up resources...');
	stopEmbeddedPostgres();
});

// ── Helper functions ─────────────────────────────────────────

/**
 * Starts the Express backend server
 * In development: loads the .ts file with ts-node
 * In production: loads the compiled .js file
 */
async function startBackendServer(isDev: boolean): Promise<void> {
	try {
		const backendSrcPath = path.join(__dirname, '..', '..', 'backend', 'src', 'app.ts');
		const backendDistPath = path.join(__dirname, '..', '..', 'backend', 'dist', 'app.js');
		const backendEntryPath = isDev ? backendSrcPath : backendDistPath;

		// In development, register ts-node if the file is TypeScript
		if (isDev && backendEntryPath.endsWith('.ts')) {
			require('ts-node').register({
				compilerOptions: {
					module: 'commonjs',
					moduleResolution: 'node'
				}
			});
		}

		// Validate that the file exists
		if (!fs.existsSync(backendEntryPath)) {
			throw new Error(`Backend entry file not found: ${backendEntryPath}`);
		}

		// Load and execute the startServer function
		const { startServer } = require(backendEntryPath);

		if (typeof startServer !== 'function') {
			throw new Error('Backend does not export a startServer function');
		}

		await startServer();
		console.log('[BACKEND] Server started');
	} catch (error: any) {
		const errMsg = error?.message || String(error);

		// If the port is already in use, the server may already be running
		if (error?.code === 'EADDRINUSE' || errMsg.includes('EADDRINUSE')) {
			console.warn('[BACKEND] Port 5000 is already in use. The server may already be running.');
		} else {
			throw error;
		}
	}
}
