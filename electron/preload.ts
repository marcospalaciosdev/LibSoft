import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {

    closeWindow: () => ipcRenderer.send('window-close'),
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),
    onWindowMaximizedStateChanged: (callback: (maximized: boolean) => void) => {
        const listener = (_event: IpcRendererEvent, maximized: boolean) => callback(maximized);
        ipcRenderer.on('window-maximized-state-changed', listener);
        return () => ipcRenderer.removeListener('window-maximized-state-changed', listener);
    },
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    selectFile: async (type: 'lsbak' | 'other') => {
        let result: Promise<string | null>;
        if (type === 'lsbak') {
            result = await ipcRenderer.invoke('select-lsbak-file');
        } else {
            result = await ipcRenderer.invoke('select-file');
        }
        return result;
    },
    exportBackup: (folderPath: string, userPassword?: string) => ipcRenderer.invoke('export-backup', folderPath, userPassword),
    importBackup: (filePath: string, userPassword?: string) => ipcRenderer.invoke('import-backup', filePath, userPassword),
    getBackupHistory: () => ipcRenderer.invoke('get-backup-history'),
    getDefaultBackupRoute: () => ipcRenderer.invoke('get-default-backup-path'),
    setDefaultBackupRoute: (route: string) => ipcRenderer.invoke('set-default-backup-path', route),
    revealInFileExplorer: (filePath: string) => ipcRenderer.invoke('reveal-in-file-explorer', filePath),
    saveAuthSession: (session: { token: string; user: unknown }) => ipcRenderer.invoke('save-auth-session', session),
    getAuthSession: () => ipcRenderer.invoke('get-auth-session'),
    clearAuthSession: () => ipcRenderer.invoke('clear-auth-session'),
    showNotification: (title: string, body: string) => ipcRenderer.send('show-notification', title, body),
});