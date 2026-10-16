import { useState } from "react";
import { firstCap } from "@/shared/utils/firstCap";
import { useTranslation } from "react-i18next";

import { Button, Badge } from "@/shared/components/ui/index";
import { useBackup } from "../hooks/useBackup";
import { BackupPasswordModal } from "../components/BackupPasswordModal";

import { formatDateShort } from "@/shared/utils";
import { SectionHeader } from "@/shared/components/layout/SectionHeader";
import type { DataStatus } from "@LibSoft/shared-types";

const HISTORY_TAB_GRID_CLASSNAME = 'grid-cols-[1fr_15%_30%_1fr_1fr_5%]'

export function MaintenancePage() {
    const { t, i18n } = useTranslation();
    const {
        isExporting,
        isImporting,
        lastBackup,
        history,
        exportBackup,
        importBackup,
    } = useBackup();

    const [passwordModal, setPasswordModal] = useState<{
        isOpen: boolean;
        mode: 'export' | 'import';
        targetPath: string;
    }>({
        isOpen: false,
        mode: 'export',
        targetPath: '',
    });

    const handleExportClick = async () => {
        if (!window.electronAPI?.selectFolder) return;
        const folder = await window.electronAPI.selectFolder();
        if (!folder) return;

        setPasswordModal({
            isOpen: true,
            mode: 'export',
            targetPath: folder,
        });
    };

    const handleImportClick = async () => {
        if (!window.electronAPI?.selectFile) return;

        const confirm = window.confirm(
            firstCap(t('maintenance.systemBackup.import.warning'))
        );
        if (!confirm) return;

        const file = await window.electronAPI.selectFile('lsbak');
        if (!file) return;

        setPasswordModal({
            isOpen: true,
            mode: 'import',
            targetPath: file,
        });
    };

    const handlePasswordSubmit = async (password: string) => {
        if (passwordModal.mode === 'export') {
            await exportBackup(passwordModal.targetPath, password);
        } else {
            await importBackup(passwordModal.targetPath, password);
        }
    };

    const handleRevealFile = async (filePath: string) => await window.electronAPI.revealInFileExplorer(filePath);

    const exportStatus: DataStatus = isExporting ? 'loading' : 'idle';
    const importStatus: DataStatus = isImporting ? 'loading' : 'idle';

    return (
        <div className="flex flex-col p-6 animate-fade-in">
            <SectionHeader
                title={firstCap(t('maintenance.title'))}
                description={firstCap(t('maintenance.subtitle'))}
                icon="build"
            />
            <div className="flex flex-col gap-5">
                <div className="grid grid-cols-[70%_calc(30%-1rem)] gap-4">
                    <div className="rounded-lg bg-[rgb(var(--color-bg))] p-6 flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <div className="w-full flex items-center gap-3">
                                <span className="material-symbols-outlined text-(length:--fs-icon-md) text-[rgb(var(--color-primary-500))]">
                                    database
                                </span>
                                <span className="text-[rgb(var(--color-text))] text-[length:var(--fs-body-sm)] font-bold">
                                    {firstCap(t('maintenance.systemBackup.title'))}
                                </span>
                            </div>
                            <span className="text-(length:--fs-caption) text-[rgb(var(--color-text))] w-[65%] mt-1">
                                {firstCap(t('maintenance.systemBackup.description'))}
                            </span>
                        </div>
                        <div className="w-full gap-4 grid grid-cols-2">
                            <div className="rounded-lg p-7 bg-[rgb(var(--color-bg-secondary))] flex flex-col gap-4 h-[275px]">
                                <Button
                                    variant="invertedPrimary"
                                    size="sm"
                                    className="aspect-square w-12"
                                    onClick={handleExportClick}
                                    isDisabled={exportStatus === 'loading' || importStatus === 'loading'}
                                >
                                    <span className="material-symbols-outlined text-(length:--fs-icon-md)">
                                        download
                                    </span>
                                </Button>
                                <span className="text-[rgb(var(--color-text))] text-[length:var(--fs-body-sm)] font-bold mt-3">
                                    {firstCap(t('maintenance.systemBackup.exportBackup.title'))}
                                </span>
                                <span className="text-[rgb(var(--color-text))] text-(length:--fs-caption) w-[75%]">
                                    {firstCap(t('maintenance.systemBackup.exportBackup.description'))}
                                </span>
                                <Button
                                    variant="invertedPrimary"
                                    size="sm"
                                    className='w-full mt-auto rounded-md !p-3'
                                    onClick={handleExportClick}
                                    isDisabled={exportStatus === 'loading' || importStatus === 'loading'}
                                >
                                    <span className="text-(length:--fs-caption) font-bold">
                                        {exportStatus === 'loading' ? firstCap(t('maintenance.systemBackup.exportBackup.loading')) : firstCap(t('maintenance.systemBackup.exportBackup.button'))}
                                    </span>
                                </Button>
                            </div>
                            <div className="h-[275px] rounded-lg p-7 bg-[rgb(var(--color-bg-secondary))] flex flex-col gap-3">
                                <span className="material-symbols-outlined text-(length:--fs-icon-md) text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-bg))] w-12 h-12 flex items-center justify-center rounded-full">
                                    cloud_upload
                                </span>
                                <div className="flex flex-row items-center gap-2 w-fit mt-3">
                                    <span className="text-[rgb(var(--color-text))] text-[length:var(--fs-body-sm)] font-bold">
                                        {firstCap(t('maintenance.systemBackup.lastBackup.title'))}
                                    </span>
                                    <Button
                                        variant='ghost'
                                        className='!p-1.5 aspect-square rounded-sm'
                                        onClick={async () => {
                                            await handleRevealFile(lastBackup?.filePath ?? '');
                                        }}
                                        isDisabled={!lastBackup?.exists}
                                        tooltip={{
                                            className: 'shadow-md',
                                            text:
                                                lastBackup?.exists
                                                    ? firstCap(t('common.actions.revealInFileExplorer'))
                                                    : firstCap(t('maintenance.backupHistory.tab.errors.thisFileDoesNotExists')),
                                            fontSize: '11px',
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-[length:var(--fs-icon-sm)] text-[rgb(var(--color-text-muted))]">
                                            folder
                                        </span>
                                    </Button>
                                </div>
                                <div className="flex flex-col gap-4 mt-2">
                                    <div className="flex flex-row justify-between items-center">
                                        <div className="flex flex-row items-center gap-2">
                                            <span className="material-symbols-outlined text-[length:var(--fs-icon-sm)] text-[rgb(var(--color-text-muted))]">
                                                calendar_today
                                            </span>
                                            <span className="text-[rgb(var(--color-text-muted))] text-(length:--fs-caption) uppercase tracking-wider font-bold">
                                                {firstCap(t('maintenance.systemBackup.lastBackup.metrics.date'))}
                                            </span>
                                        </div>
                                        <span className="text-[rgb(var(--color-text))] text-(length:--fs-caption) font-bold truncate max-w-[100px]" title={lastBackup ? new Date(lastBackup.date).toLocaleString(undefined, { timeZone: localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone }) : firstCap(t('maintenance.systemBackup.lastBackup.noData'))}>
                                            {lastBackup ? new Date(lastBackup.date).toLocaleDateString(undefined, { timeZone: localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone }) : firstCap(t('maintenance.systemBackup.lastBackup.noData'))}
                                        </span>
                                    </div>
                                    <div className="flex flex-row justify-between items-center">
                                        <div className="flex flex-row items-center gap-2">
                                            <span className="material-symbols-outlined text-[length:var(--fs-icon-sm)] text-[rgb(var(--color-text-muted))]">
                                                cloud_upload
                                            </span>
                                            <span className="text-[rgb(var(--color-text-muted))] text-(length:--fs-caption) uppercase tracking-wider font-bold">
                                                {firstCap(t('maintenance.systemBackup.lastBackup.metrics.size'))}
                                            </span>
                                        </div>
                                        <span className="text-[rgb(var(--color-text))] text-(length:--fs-caption) font-bold">
                                            {lastBackup ? lastBackup.size : '-'}
                                        </span>
                                    </div>
                                    <div className="flex flex-row justify-between items-center">
                                        <div className="flex flex-row items-center gap-2">
                                            <span className="material-symbols-outlined text-[length:var(--fs-icon-sm)] text-[rgb(var(--color-text-muted))]">
                                                check_circle
                                            </span>
                                            <span className="text-[rgb(var(--color-text-muted))] text-(length:--fs-caption) uppercase tracking-wider font-bold">
                                                {firstCap(t('maintenance.systemBackup.lastBackup.metrics.integrity'))}
                                            </span>
                                        </div>
                                        <span className={`text-(length:--fs-caption) font-bold ${lastBackup?.status === 'success' ? 'text-green-500 font-bold' : 'text-[rgb(var(--color-text))]'}`}>
                                            {lastBackup?.status === 'success' ? firstCap(t('common.statusValues.valid')) : firstCap(t('common.statusValues.notVerified'))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg bg-[rgb(var(--color-bg))] p-6">
                        <div className="flex flex-col gap-2">
                            <div className="w-full flex items-center gap-3">
                                <span className="material-symbols-outlined text-(length:--fs-icon-md) text-[rgb(var(--color-primary-500))]">
                                    cloud_upload
                                </span>
                                <span className="text-[rgb(var(--color-text))] text-[length:var(--fs-body-sm)] font-bold">
                                    {firstCap(t('maintenance.dataImport.title'))}
                                </span>
                            </div>
                            <span className="text-(length:--fs-caption) text-[rgb(var(--color-text))]">
                                {firstCap(t('maintenance.dataImport.description'))}
                            </span>
                        </div>
                        <div
                            onClick={importStatus === 'loading' || exportStatus === 'loading' ? undefined : handleImportClick}
                            className={`w-full aspect-square border-dashed border-2 border-[rgb(var(--color-text-soft))] rounded-lg mt-7 flex flex-col items-center justify-center hover:border-[rgb(var(--color-primary-500))] transition-colors duration-200 cursor-pointer group ${importStatus === 'loading' || exportStatus === 'loading' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className="material-symbols-outlined text-4xl bg-[rgb(var(--color-surface))] p-5 rounded-md text-[rgb(var(--color-text-soft))] mb-5 group-hover:text-[rgb(var(--color-primary-500))] group-hover:scale-110 transition-all duration-200">
                                {importStatus === 'loading' ? 'sync' : 'upload_file'}
                            </span>
                            <span className="text-[rgb(var(--color-text))] text-[length:var(--fs-body-sm)] font-bold mb-2">
                                {importStatus === 'loading' ? firstCap(t('maintenance.dataImport.uploadFile.loading')) : firstCap(t('maintenance.dataImport.uploadFile.title'))}
                            </span>
                            <span className="text-(length:--fs-caption) text-[rgb(var(--color-text))] text-center px-4">
                                {importStatus === 'loading' ? '' : firstCap(t('maintenance.dataImport.uploadFile.description'))}
                            </span>
                        </div>
                        <div className="rounded-lg bg-red-500/10 p-7 mt-8 flex items-center gap-2">
                            <span className="material-symbols-outlined text-(length:--fs-icon-md) text-red-500 mr-4">
                                warning
                            </span>
                            <span className="text-(length:--fs-caption) text-red-500">
                                {firstCap(t('maintenance.dataImport.warning'))}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2 p-6 bg-[rgb(var(--color-bg))] rounded-md">
                    <div className="flex justify-between flex-col gap-2">
                        <div className="flex flex-row items-center gap-2">
                            <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] text-(length:--fs-icon-md)">
                                build
                            </span>
                            <span className="text-[rgb(var(--color-text))] text-[length:var(--fs-body-sm)] font-bold">
                                {firstCap(t('maintenance.backupHistory.title'))}
                            </span>
                        </div>
                        <span className="text-(length:--fs-caption) text-[rgb(var(--color-text))] w-[65%] my-1">
                            {firstCap(t('maintenance.backupHistory.description'))}
                        </span>
                    </div>
                    <div className="w-full rounded-xl border border-[rgb(var(--color-border-soft))] bg-[rgb(var(--color-bg-surface))] max-h-[300px] overflow-auto">
                        <table className="w-full text-left border-collapse relative">
                            <thead className="sticky inset-0 z-10 bg-[rgb(var(--color-bg))]">
                                <tr className={`grid ${HISTORY_TAB_GRID_CLASSNAME} border-b border-[rgb(var(--color-border-soft))] bg-[rgb(var(--color-bg-muted,rgba(0,0,0,0.02)))] px-4 py-3.5`}>
                                    <th className="flex items-center text-[rgb(var(--color-text))] text-(length:--fs-caption) font-semibold tracking-wide uppercase opacity-80">
                                        {firstCap(t('maintenance.backupHistory.tab.fields.type.label'))}
                                    </th>
                                    <th className="flex items-center text-[rgb(var(--color-text))] text-(length:--fs-caption) font-semibold tracking-wide uppercase opacity-80">
                                        {firstCap(t('maintenance.backupHistory.tab.fields.date.label'))}
                                    </th>
                                    <th className="flex items-center text-[rgb(var(--color-text))] text-(length:--fs-caption) font-semibold tracking-wide uppercase opacity-80">
                                        {firstCap(t('maintenance.backupHistory.tab.fields.filename.label'))}
                                    </th>
                                    <th className="flex items-center text-[rgb(var(--color-text))] text-(length:--fs-caption) font-semibold tracking-wide uppercase opacity-80">
                                        {firstCap(t('maintenance.backupHistory.tab.fields.status.label'))}
                                    </th>
                                    <th className="flex items-center text-[rgb(var(--color-text))] text-(length:--fs-caption) font-semibold tracking-wide uppercase opacity-80">
                                        {firstCap(t('maintenance.backupHistory.tab.fields.size.label'))}
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[rgb(var(--color-border-soft))]">
                                {history.map((backup, index) => (
                                    <tr
                                        key={index}
                                        className={`grid ${HISTORY_TAB_GRID_CLASSNAME} items-center px-4 py-3 hover:bg-[rgb(var(--color-bg-secondary))] transition-colors duration-150 ease-in-out`}
                                    >
                                        <td className="flex items-center gap-5">
                                            <span className="material-symbols-outlined text-[length:var(--fs-icon-sm)] p-1.5 rounded-lg bg-[rgb(var(--color-border-soft))]/30 text-[rgb(var(--color-text-soft))]">
                                                {backup.type === 'export' ? 'cloud_download' : 'cloud_upload'}
                                            </span>
                                            <span className="text-[rgb(var(--color-text))] text-[length:var(--fs-body-sm)]">
                                                {firstCap(t(`maintenance.backupHistory.${backup.type}`))}
                                            </span>
                                        </td>

                                        <td className="flex items-center text-[rgb(var(--color-text))] text-(length:--fs-caption) font-medium">
                                            {formatDateShort(backup.date, i18n.language)}
                                        </td>

                                        <td className="flex items-center w-full min-w-0 pr-4">
                                            <div
                                                className="flex items-center gap-1.5 w-full bg-[rgb(var(--color-bg-code,rgba(0,0,0,0.02)))] px-2 py-1 rounded border border-[rgb(var(--color-border-soft))]/50">
                                                <span className="material-symbols-outlined text-[16px] text-[rgb(var(--color-text-soft))] shrink-0">
                                                    description
                                                </span>
                                                <span
                                                    className="text-(length:--fs-caption) text-[rgb(var(--color-text-soft))] font-mono truncate w-full"
                                                    title={backup.filePath}
                                                >
                                                    {backup.filePath?.split('/').pop()}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="flex items-center">
                                            <Badge
                                                variant={backup.status === 'success' ? 'success' : 'error'}
                                            >
                                                {firstCap(t(`common.statusValues.${backup.status}`))}
                                            </Badge>
                                        </td>

                                        <td className="flex items-center text-[rgb(var(--color-text-soft))] text-(length:--fs-caption) font-mono">
                                            {backup.size || '--'}
                                        </td>

                                        <td className='flex items-center'>
                                            <Button
                                                onClick={async () =>
                                                    await handleRevealFile(backup.filePath ?? '')
                                                }
                                                variant="ghost"
                                                className="h-7 w-7 rounded-sm"
                                                tooltip={{
                                                    className: 'shadow-md',
                                                    text:
                                                        backup.exists
                                                            ? firstCap(t('common.actions.revealInFileExplorer'))
                                                            : firstCap(t('maintenance.backupHistory.tab.errors.thisFileDoesNotExists')),
                                                    fontSize: '11px',
                                                }}
                                                isDisabled={!backup.exists}
                                            >
                                                <span className="material-symbols-outlined text-[16px] text-[rgb(var(--color-text-soft))] shrink-0">
                                                    folder
                                                </span>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <BackupPasswordModal
                isOpen={passwordModal.isOpen}
                onClose={() => setPasswordModal(prev => ({ ...prev, isOpen: false }))}
                mode={passwordModal.mode}
                targetPath={passwordModal.targetPath}
                onSubmit={handlePasswordSubmit}
                isLoading={exportStatus === 'loading' || importStatus === 'loading'}
            />
        </div>
    );
}