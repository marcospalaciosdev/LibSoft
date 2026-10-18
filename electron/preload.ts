import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

/**
 * Exposes a safe, sandboxed API to the renderer process via contextBridge.
 * This is the only communication channel between the frontend (React) and
 * the Electron main process. All IPC calls are proxied here.
 *
 * Available as `window.electronAPI` in the renderer.
 */
contextBridge.exposeInMainWorld('electronAPI', {

    // ── Window controls ──────────────────────────────────────────────
    closeWindow: () => ipcRenderer.send('window-close'),
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),

    /** Returns whether the window is currently maximized. */
    isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),

    /**
     * Subscribes to window maximize/restore state changes.
     * @returns A cleanup function that removes the listener.
     */
    onWindowMaximizedStateChanged: (callback: (maximized: boolean) => void) => {
        const listener = (_event: IpcRendererEvent, maximized: boolean) => callback(maximized);
        ipcRenderer.on('window-maximized-state-changed', listener);
        return () => ipcRenderer.removeListener('window-maximized-state-changed', listener);
    },

    // ── File dialogs ─────────────────────────────────────────────────
    /** Opens a native folder picker dialog. Returns the selected path or null. */
    selectFolder: () => ipcRenderer.invoke('select-folder'),

    /**
     * Opens a native file picker dialog.
     * @param type - 'lsbak' filters for LibSoft backup files; 'other' allows all files.
     */
    selectFile: async (type: 'lsbak' | 'other') => {
        let result: Promise<string | null>;
        if (type === 'lsbak') {
            result = await ipcRenderer.invoke('select-lsbak-file');
        } else {
            result = await ipcRenderer.invoke('select-file');
        }
        return result;
    },

    // ── Backup operations ────────────────────────────────────────────
    /** Exports the current database to an encrypted .lsbak file. */
    exportBackup: (folderPath: string, userPassword?: string) => ipcRenderer.invoke('export-backup', folderPath, userPassword),

    /** Imports and restores a previously exported .lsbak backup file. */
    importBackup: (filePath: string, userPassword?: string) => ipcRenderer.invoke('import-backup', filePath, userPassword),

    /** Returns the list of past export/import operations from backup history. */
    getBackupHistory: () => ipcRenderer.invoke('get-backup-history'),

    // ── Backup configuration ─────────────────────────────────────────
    /** Returns the currently configured default backup destination path. */
    getDefaultBackupRoute: () => ipcRenderer.invoke('get-default-backup-path'),

    /** Persists a new default backup destination path. */
    setDefaultBackupRoute: (route: string) => ipcRenderer.invoke('set-default-backup-path', route),

    /** Returns the full backup configuration object (schedule, path, enabled flag). */
    getBackupConfig: () => ipcRenderer.invoke('get-backup-config'),

    /** Saves a (partial) backup configuration update. */
    saveBackupConfig: (config: any) => ipcRenderer.invoke('save-backup-config', config),

    // ── Shell utilities ──────────────────────────────────────────────
    /** Opens the system file explorer and highlights the specified file. */
    revealInFileExplorer: (filePath: string) => ipcRenderer.invoke('reveal-in-file-explorer', filePath),

    // ── Auth session ─────────────────────────────────────────────────
    /** Encrypts and persists the user's auth session to disk. */
    saveAuthSession: (session: { token: string; user: unknown }) => ipcRenderer.invoke('save-auth-session', session),

    /** Retrieves and decrypts the stored auth session, or null if none exists. */
    getAuthSession: () => ipcRenderer.invoke('get-auth-session'),

    /** Deletes the stored auth session file. */
    clearAuthSession: () => ipcRenderer.invoke('clear-auth-session'),

    // ── Notifications ────────────────────────────────────────────────
    /** Triggers a native OS notification with the given title and body. */
    showNotification: (title: string, body: string) => ipcRenderer.send('show-notification', title, body),
});