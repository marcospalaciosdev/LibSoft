import { httpClient } from "@/shared/services/http";

export interface BackupHistoryEntry {
    date: string;
    size?: string;
    status: 'success' | 'failed';
    type: 'export' | 'import';
    filePath?: string;
    error?: string;
}

export const maintenanceApi = {
    getBackupsHistory: async (): Promise<BackupHistoryEntry[]> => {
        return httpClient.get('/maintenance/backups-history');
    },
};