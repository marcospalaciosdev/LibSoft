import { BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

/**
 * Window Module
 *
 * Manages the lifecycle of the main application window, including creation,
 * IPC-based window controls (close/minimize/maximize), and maximize-state
 * synchronization with the renderer process.
 */

// Holds a reference to the main window instance; null when the window is closed.
export let mainWindow: BrowserWindow | null = null;

/**
 * Returns the current main window instance, or null if it has been closed.
 */
export function getMainWindow(): BrowserWindow | null {
	return mainWindow;
}

/**
 * Sends the current window maximized state to the renderer.
 * Used to keep the custom title bar in sync with the actual window state.
 */
function sendWindowMaximizedState(): void {
	if (!mainWindow) return;
	mainWindow.webContents.send('window-maximized-state-changed', mainWindow.isMaximized());
}

/**
 * Registers IPC handlers for custom window controls.
 * Called once when the main window is created.
 *
 * Handles:
 * - is-window-maximized (invoke): returns current maximized state
 * - window-close (send): closes the window
 * - window-minimize (send): minimizes the window
 * - window-maximize (send): toggles maximize/restore
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
		// Toggle between maximized and restored states
		if (mainWindow.isMaximized()) {
			mainWindow.unmaximize();
		} else {
			mainWindow.maximize();
		}
		// Notify the renderer of the new state immediately
		sendWindowMaximizedState();
	});
}

/**
 * Creates and configures the main application window.
 *
 * In development: loads the Vite dev server (hot reload enabled).
 * In production: loads the compiled React static build from disk.
 *
 * Also registers F12 as a DevTools toggle shortcut.
 *
 * @param isDev - Whether the app is running in development mode.
 */
export async function createWindow(isDev: boolean): Promise<void> {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		frame: false,         // Custom frameless window (title bar is rendered in React)
		transparent: false,
		thickFrame: true,     // Keeps native resize behavior on Windows
		resizable: true,
		maximizable: true,
		fullscreenable: true,
		hasShadow: true,
		webPreferences: {
			preload: path.join(__dirname, '..', 'preload.js'), // Sandboxed bridge to main process
			nodeIntegration: false,   // Disabled for security
			contextIsolation: true,   // Enforces renderer/main process isolation
		},
	});

	// Register IPC handlers for window controls
	registerWindowIpcHandlers();

	// Load the appropriate URL or file depending on the environment
	if (!isDev) {
		// Production: load the compiled React bundle
		await mainWindow.loadFile(
			path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html')
		);
	} else {
		// Development: connect to the Vite dev server
		await mainWindow.loadURL(`http://localhost:3001/books`);
	}


	// Allow opening DevTools with F12 in any environment
	mainWindow.webContents.on('before-input-event', (event, input) => {
		if (input.key === 'F12') {
			mainWindow?.webContents.openDevTools();
			event.preventDefault();
		}
	});

	// Keep the renderer in sync when the OS maximize state changes
	mainWindow.on('maximize', sendWindowMaximizedState);
	mainWindow.on('unmaximize', sendWindowMaximizedState);

	// Release the reference when the window is closed
	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	console.log('[WINDOW] Main window created');
}
