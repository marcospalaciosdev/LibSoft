import { Modal } from '@/shared/components/ui/Modal';
import { Button, Spinner } from '@/shared/components/ui';
import { auditApi } from '../api/audit.api';

import { useState, useEffect } from 'react';

import type { AuditLogItem } from '@LibSoft/shared-types';

interface AuditLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    logId: string | null;
}

export function AuditLogModal({
    isOpen,
    onClose,
    logId,
}: AuditLogModalProps) {

    const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [copied, setCopied] = useState({
        old: false,
        new: false,
        metadata: false
    });

    const fetchSelectedLog = async (id: string) => {
        try {
            setIsLoading(true);
            const response = await auditApi.getById(id);
            console.log(response)
            setSelectedLog(response);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (isOpen && logId) fetchSelectedLog(logId);
    }, [isOpen, logId]);

    const handleCopyToClipboard = async (jsonString: string, type: 'old' | 'new' | 'metadata') => {
        try {
            await navigator.clipboard.writeText(jsonString);
            setCopied(prev => ({ ...prev, [type]: true }));
            setTimeout(() => setCopied(prev => ({ ...prev, [type]: false })), 2000);
        } catch (err) {
            console.error('Error al copiar:', err);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="3xl"
            className='max-h-150 overflow-y-auto'
        >
            <div className='w-full h-full'>
                {isLoading ? (
                    <div className='w-full h-150 flex items-center justify-center'>
                        <Spinner />
                    </div>
                ) : (
                    <>
                        <div className='w-full border-b border-[rgb(var(--color-border))]'>
                            <div className="flex items-center justify-between px-6 py-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-[rgb(var(--color-text))]">
                                        Detalle del Evento <span className=''>#{selectedLog?.id}</span>
                                    </h2>
                                    <p className="text-[11px] text-[rgb(var(--color-text-muted))] font-medium">
                                        Acción "{selectedLog?.action}" sobre el módulo "{selectedLog?.module}"
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5 text-xs">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[rgb(var(--color-bg-secondary))]/50 border border-[rgb(var(--color-border))]/40">
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-[rgb(var(--color-text-muted))]">
                                        Módulo
                                    </span>
                                    <span className="font-semibold text-[rgb(var(--color-text))] capitalize">
                                        {selectedLog?.module}
                                    </span>
                                </div>

                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-[rgb(var(--color-text-muted))]">
                                        ID Entidad
                                    </span>
                                    <span className="font-mono text-[rgb(var(--color-text))]">
                                        {selectedLog?.entityId ? `#${selectedLog?.entityId}` : '—'}
                                    </span>
                                </div>

                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-[rgb(var(--color-text-muted))]">
                                        Dirección IP
                                    </span>
                                    <span className="font-mono text-[rgb(var(--color-text))]">
                                        {selectedLog?.ipAddress || '—'}
                                    </span>
                                </div>

                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-[rgb(var(--color-text-muted))]">
                                        Fecha y Hora
                                    </span>
                                    <span className="text-[rgb(var(--color-text))]">
                                        {new Date(selectedLog?.createdAt || '').toLocaleString('en-US', { timeZoneName: 'short', timeZone: localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone })}
                                    </span>
                                </div>
                            </div>

                            {selectedLog?.userAgent && (
                                <div className="p-3 rounded-xl bg-[rgb(var(--color-bg-secondary))]/30 border border-[rgb(var(--color-border))]/30 text-[11px] text-[rgb(var(--color-text-muted))] font-mono break-all">
                                    <span className="font-sans font-semibold text-[rgb(var(--color-text))] block mb-0.5">
                                        User Agent:
                                    </span>
                                    {selectedLog?.userAgent}
                                </div>
                            )}

                            {selectedLog?.oldValues || selectedLog?.newValues || selectedLog?.metadata ? (
                                <div className='w-full flex flex-col gap-4'>
                                    {selectedLog?.metadata ? (
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center justify-between gap-1.5 font-bold text-[rgb(var(--color-text))]">
                                                <div className='flex items-center gap-1'>
                                                    <span className="material-symbols-outlined text-base">data_table</span>
                                                    <span>Metadata</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCopyToClipboard(JSON.stringify(selectedLog?.metadata), 'metadata')}
                                                    className='h-7'
                                                >
                                                    <span className="material-symbols-outlined text-base">
                                                        {copied.metadata ? 'check' : 'content_copy'}
                                                    </span>
                                                </Button>
                                            </div>
                                            <div className="rounded-xl bg-[rgb(var(--color-bg-secondary))]/50 border border-[rgb(var(--color-border))]/40 p-3 overflow-hidden">
                                                <pre className="text-wrap font-mono text-[11px] leading-relaxed text-[rgb(var(--color-text))] overflow-x-auto max-h-72">
                                                    {selectedLog?.metadata
                                                        ? JSON.stringify(selectedLog?.metadata, null, 2)
                                                        : 'null'}
                                                </pre>
                                            </div>
                                        </div>
                                    ) : (null)}
                                    <div className="flex flex-row gap-4 w-full">
                                        {selectedLog?.oldValues ? (
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center justify-between gap-1.5 font-bold text-red-500">
                                                    <div className='flex items-center gap-1'>
                                                        <span className="material-symbols-outlined text-base">remove_circle_outline</span>
                                                        <span>Valores Previos (oldValues)</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCopyToClipboard(JSON.stringify(selectedLog?.oldValues), 'old')}
                                                        className='h-7'
                                                    >
                                                        <span className="material-symbols-outlined text-base">
                                                            {copied.old ? 'check' : 'content_copy'}
                                                        </span>
                                                    </Button>
                                                </div>
                                                <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3 overflow-hidden">
                                                    <pre className="text-wrap font-mono text-[11px] leading-relaxed text-red-500 overflow-x-auto max-h-72">
                                                        {selectedLog?.oldValues
                                                            ? JSON.stringify(selectedLog?.oldValues, null, 2)
                                                            : 'null'}
                                                    </pre>
                                                </div>
                                            </div>
                                        ) : null}

                                        {selectedLog?.newValues ? (
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center w-full justify-between gap-1.5 font-bold text-green-500">
                                                    <div className='flex items-center gap-1'>
                                                        <span className="material-symbols-outlined text-base">add_circle_outline</span>
                                                        <span>Valores Nuevos (newValues)</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCopyToClipboard(JSON.stringify(selectedLog?.newValues), 'new')}
                                                        className='h-7'
                                                    >
                                                        <span className="material-symbols-outlined text-base">
                                                            {copied.new ? 'check' : 'content_copy'}
                                                        </span>
                                                    </Button>
                                                </div>
                                                <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-3 overflow-hidden">
                                                    <pre className="text-wrap font-mono text-[11px] leading-relaxed text-green-500 overflow-x-auto max-h-72">
                                                        {selectedLog?.newValues
                                                            ? JSON.stringify(selectedLog?.newValues, null, 2)
                                                            : 'null'}
                                                    </pre>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}

                            {/* Footer / Botón de Cierre */}
                            <div className="pt-3 border-t border-[rgb(var(--color-border))]/40 flex justify-end">
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={onClose}
                                    className="px-5 font-medium rounded-md border border-[rgb(var(--color-border))]/60 text-[rgb(var(--color-text))]"
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </Modal>
    );
}