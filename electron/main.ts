/**
 * LibSoft - Electron Main Process
 *
 * Punto de entrada de la aplicación de escritorio.
 * Gestiona:
 * - Ciclo de vida de la aplicación (ready, quit, etc.)
 * - Inicialización de PostgreSQL embebido (en producción)
 * - Creación de la ventana principal
 * - Registro de manejadores IPC
 * - Inicialisación del servidor backend
 */

import { app, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// ── Módulos propios ──────────────────────────────────────────
import { setupPostgresEnv, startEmbeddedPostgres, stopEmbeddedPostgres, getPostgresConfig } from './modules/postgres';
import { createWindow, getMainWindow } from './modules/window';
import { registerIpcHandlers } from './modules/ipc';

// ── Configuración global ─────────────────────────────────────
process.env.ELECTRON_RUN = 'true';

const IS_PROD = app.isPackaged;
const isDev = !IS_PROD;

console.log(`[APP] Iniciando en modo ${IS_PROD ? 'PRODUCCIÓN' : 'DESARROLLO'}`);

// ── Cargar variables de entorno ──────────────────────────────
if (isDev) {
	const backendEnvPath = path.join(__dirname, '..', '..', 'backend', '.env');
	const result = dotenv.config({ path: backendEnvPath });
	if (result.error) {
		console.warn('[APP] No se pudo cargar backend/.env:', result.error.message);
	}
}
setupPostgresEnv();

// ── Eventos de ciclo de vida ─────────────────────────────────

/**
 * Evento: La aplicación está lista
 * Ejecuta la secuencia de inicialización completa
 */
app.on('ready', async () => {
	try {
		console.log('[APP] Evento ready disparado');

		if (IS_PROD) {
			console.log('[APP] Iniciando PostgreSQL embebido...');
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

		console.log('[APP] Configuración de BD:', {
			...dbConfig,
			password: '***'
		});

		registerIpcHandlers(dbConfig, IS_PROD, getMainWindow);

		console.log('[APP] Iniciando servidor backend...');
		await startBackendServer(isDev);

		console.log('[APP] Creando ventana principal...');
		await createWindow(isDev);

		console.log('[APP] Aplicación iniciada exitosamente');
	} catch (err: any) {
		const errMsg = err?.message || String(err);
		console.error('[APP] Error fatal al iniciar:', errMsg);
		dialog.showErrorBox('Error al iniciar la aplicación', errMsg);
		app.quit();
	}
});

/**
 * Evento: Todas las ventanas fueron cerradas
 * En macOS, las aplicaciones permanecen activas hasta que se cierra explícitamente
 */
app.on('window-all-closed', () => {
	console.log('[APP] Todas las ventanas fueron cerradas');
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

/**
 * Evento: La aplicación va a salir
 * Limpia recursos antes de cerrar
 */
app.on('will-quit', () => {
	console.log('[APP] Aplicación cerrando, limpiando recursos...');
	stopEmbeddedPostgres();
});

// ── Funciones auxiliares ─────────────────────────────────────

/**
 * Inicia el servidor backend de Express
 * En desarrollo: carga el archivo .ts con ts-node
 * En producción: carga el archivo .js compilado
 */
async function startBackendServer(isDev: boolean): Promise<void> {
	try {
		const backendSrcPath = path.join(__dirname, '..', '..', 'backend', 'src', 'app.ts');
		const backendDistPath = path.join(__dirname, '..', '..', 'backend', 'dist', 'app.js');
		const backendEntryPath = isDev ? backendSrcPath : backendDistPath;

		// En desarrollo, registrar ts-node si el archivo es TypeScript
		if (isDev && backendEntryPath.endsWith('.ts')) {
			require('ts-node').register({
				compilerOptions: {
					module: 'commonjs',
					moduleResolution: 'node'
				}
			});
		}

		// Validar que el archivo existe
		if (!fs.existsSync(backendEntryPath)) {
			throw new Error(`No se encontró el archivo de entrada del backend: ${backendEntryPath}`);
		}

		// Cargar y ejecutar la función startServer
		const { startServer } = require(backendEntryPath);

		if (typeof startServer !== 'function') {
			throw new Error('El backend no exporta una función startServer');
		}

		await startServer();
		console.log('[BACKEND] Servidor iniciado');
	} catch (error: any) {
		const errMsg = error?.message || String(error);

		// Si el puerto ya está en uso, podría ser que el servidor ya está corriendo
		if (error?.code === 'EADDRINUSE' || errMsg.includes('EADDRINUSE')) {
			console.warn('[BACKEND] Puerto 5000 ya está en uso. El servidor puede estar corriendo desde antes.');
		} else {
			throw error;
		}
	}
}
