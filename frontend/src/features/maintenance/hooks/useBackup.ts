import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { firstCap } from '@/shared/utils/firstCap';
import type { BackupHistoryEntry, BackupConfig } from '@/electron';

export function useBackup() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [history, setHistory] = useState<BackupHistoryEntry[]>([]);
  const [config, setConfig] = useState<BackupConfig | null>(null);

  const { t } = useTranslation();

  const fetchConfig = useCallback(async () => {
    if (!window.electronAPI?.getBackupConfig) return null;
    try {
      const cfg = await window.electronAPI.getBackupConfig();
      setConfig(cfg);
      return cfg;
    } catch (err) {
      console.error('Error al cargar configuración de backup:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const fetchHistory = useCallback(async () => {
    try {
      setIsImporting(true);
      const data = await window.electronAPI.getBackupHistory();

      setHistory(data);
    } catch (error) {
      console.error('Error al obtener el historial de backups:', error);
    } finally {
      setIsImporting(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const exportBackup = async (folderPath: string, password: string) => {
    if (!window.electronAPI?.exportBackup) return;

    try {
      setIsExporting(true);
      const res = await window.electronAPI.exportBackup(folderPath, password);

      if (window.electronAPI.showNotification) {
        window.electronAPI.showNotification(
          firstCap(t('maintenance.systemBackup.export.successTitle')),
          `${firstCap(t('maintenance.systemBackup.export.success'))} ${res.filePath}`
        );
      } else {
        alert(`${firstCap(t('maintenance.systemBackup.export.success'))} ${res.filePath}`);
      }

      await fetchHistory();
      return res;
    } catch (err) {
      console.error('Error al exportar backup:', err);
      if (window.electronAPI?.showNotification) {
        window.electronAPI.showNotification(
          firstCap(t('maintenance.systemBackup.export.errorTitle')),
          `${firstCap(t('maintenance.systemBackup.export.error'))} ${err}`
        );
      } else {
        alert(`${firstCap(t('maintenance.systemBackup.export.error'))} ${err}`);
      }
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  const importBackup = async (filePath: string, password: string) => {
    if (!window.electronAPI?.importBackup) {
      return;
    }

    try {
      setIsImporting(true);
      const res = await window.electronAPI.importBackup(filePath, password);

      if (window.electronAPI.showNotification) {
        window.electronAPI.showNotification(
          firstCap(t('maintenance.systemBackup.import.successTitle')),
          `${firstCap(t('maintenance.systemBackup.import.success'))} ${res.filePath}`
        );
      } else {
        alert(`${firstCap(t('maintenance.systemBackup.import.success'))} ${res.filePath}`);
      }

      await fetchHistory();

      if (res.requiresReload) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }

      return res;
    } catch (err) {
      console.error(
        firstCap(t('maintenance.systemBackup.import.error')),
        firstCap(t('maintenance.systemBackup.import.errorTitle')),
        err
      );
      if (window.electronAPI?.showNotification) {
        window.electronAPI.showNotification(
          firstCap(t('maintenance.systemBackup.import.errorTitle')),
          `${firstCap(t('maintenance.systemBackup.import.error'))} ${err}`
        );
      } else {
        alert(`${firstCap(t('maintenance.systemBackup.import.error'))} ${err}`);
      }
      throw err;
    } finally {
      setIsImporting(false);
    }
  };

  const getDefaultBackupRoute = async () => {
    if (!window.electronAPI?.getDefaultBackupRoute) {
      return '';
    }
    const path = await window.electronAPI.getDefaultBackupRoute();
    return path;
  }

  const setDefaultBackupRoute = async (route: string) => {
    if (!window.electronAPI?.setDefaultBackupRoute) {
      return route;
    }
    return await window.electronAPI.setDefaultBackupRoute(route);
  }

  const updateBackupConfig = async (partial: Partial<BackupConfig>) => {
    if (!window.electronAPI?.saveBackupConfig) return null;
    try {
      const updated = await window.electronAPI.saveBackupConfig(partial);
      setConfig(updated);
      return updated;
    } catch (err) {
      console.error('Error al guardar configuración de backup:', err);
      throw err;
    }
  };

  const lastSuccessExport = history.find(h => h.type === 'export' && h.status === 'success');

  return {
    isExporting,
    isImporting,
    history,
    lastBackup: lastSuccessExport || null,
    exportBackup,
    importBackup,
    refreshHistory: fetchHistory,
    getDefaultBackupRoute,
    setDefaultBackupRoute,
    config,
    fetchConfig,
    updateBackupConfig
  };
}
