import type { User } from '@LibSoft/shared-types';

export interface BackupHistoryEntry {
  date: string;
  size?: string;
  status: 'success' | 'failed';
  type: 'export' | 'import';
  filePath?: string;
  error?: string;
  exists?: boolean;
}

interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isWindowMaximized: () => Promise<boolean>;
  onWindowMaximizedStateChanged: (callback: (maximized: boolean) => void) => () => void;
  selectFolder: () => Promise<string | null>;
  selectFile: (type: 'lsbak' | 'other') => Promise<string | null>;
  exportBackup: (folderPath: string, userPassword: string) => Promise<{ filePath: string; size: string }>;
  importBackup: (filePath: string, userPassword: string) => Promise<{ filePath: string; requiresReload?: boolean }>;
  getBackupHistory: () => Promise<BackupHistoryEntry[]>;
  getDefaultBackupRoute: () => Promise<string>;
  setDefaultBackupRoute: (route: string) => Promise<string>;
  showNotification: (title: string, body: string) => void;
  revealInFileExplorer: (filePath: string) => Promise<void>;
  saveAuthSession: (session: { token: string; user: unknown }) => Promise<void>;
  getAuthSession: () => Promise<{ token: string; user: User } | null>;
  clearAuthSession: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export { };
