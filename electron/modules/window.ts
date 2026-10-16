import { BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

export let mainWindow: BrowserWindow | null = null;

/**
 * Obtiene la ventana principal actual
 */
export function getMainWindow(): BrowserWindow | null {
	return mainWindow;
}

/**
 * Obtiene el estado de maximización de la ventana
 */
function sendWindowMaximizedState(): void {
	if (!mainWindow) return;
	mainWindow.webContents.send('window-maximized-state-changed', mainWindow.isMaximized());
}

/**
 * Registra los manejadores IPC para control de ventana
 */
function registerWindowIpcHandlers(): void {
	ipcMain.handle('is-window-maximized', () => {
		return !!mainWindow?.isMaximized();
	});

	ipcMain.on('window-close', () => {
		if (!mainWindow) return;
		mainWindow.close();
	});

	ipcMain.on('window-minimize', () => {
		if (!mainWindow) return;
		mainWindow.minimize();
	});

	ipcMain.on('window-maximize', () => {
		if (!mainWindow) return;
		if (mainWindow.isMaximized()) {
			mainWindow.unmaximize();
		} else {
			mainWindow.maximize();
		}
		sendWindowMaximizedState();
	});
}

/**
 * Crea y configura la ventana principal
 */
export async function createWindow(isDev: boolean): Promise<void> {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		frame: false,
		transparent: false,
		thickFrame: true,
		resizable: true,
		maximizable: true,
		fullscreenable: true,
		hasShadow: true,
		webPreferences: {
			preload: path.join(__dirname, '..', 'preload.js'),
			nodeIntegration: false,
			contextIsolation: true,
		},
	});

	// Registrar manejadores IPC para la ventana
	registerWindowIpcHandlers();

	// Cargar la aplicación
	if (!isDev) {
		// Modo producción: carga el build estático de React
		await mainWindow.loadFile(
			path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html')
		);
	} else {
		// Modo desarrollo: carga Vite dev server
		await mainWindow.loadURL(`http://localhost:3001/books`);
	}


	mainWindow.webContents.on('before-input-event', (event, input) => {
		if (input.key === 'F12') {
			mainWindow?.webContents.openDevTools();
			event.preventDefault();
		}
	});

	// Escuchar eventos de maximización
	mainWindow.on('maximize', sendWindowMaximizedState);
	mainWindow.on('unmaximize', sendWindowMaximizedState);

	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	console.log('[WINDOW] Ventana principal creada');
}
