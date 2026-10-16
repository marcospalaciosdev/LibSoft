import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { firstCap } from '@/shared/utils/firstCap';
import { useNavigate } from 'react-router-dom';

import {
    DateRangePicker,
    DropDownMenu,
    Button,
    UserAvatar,
    PaginationFooter,
    Spinner
} from '@/shared/components/ui';

import type {
    AuditLogItem,
    GetAuditLogsParams,
    AuditPagination,
    DataStatus
} from '@LibSoft/shared-types';

import { auditApi } from '@/features/audit/api/audit.api.ts';
import { AuditLogModal } from '../components/AuditLogModal';
import { SectionHeader } from '@/shared/components/layout/SectionHeader';
import { ErrorState } from '@/shared/components/feedback';

const MODULE_OPTIONS = [
    { value: '', label: 'audit.modules.all', actions: [''] },
    { value: 'users', label: 'audit.modules.users', actions: ['', 'CREATE', 'UPDATE', 'DELETE'] },
    { value: 'books', label: 'audit.modules.books', actions: ['', 'CREATE', 'UPDATE', 'DELETE'] },
    { value: 'book_copies', label: 'audit.modules.book_copies', actions: ['', 'CREATE', 'UPDATE', 'DELETE'] },
    { value: 'loans', label: 'audit.modules.loans', actions: ['', 'CREATE', 'UPDATE', 'DELETE', 'RETURN'] },
    { value: 'auth', label: 'audit.modules.auth', actions: ['', 'LOGIN'] },
    { value: 'library_profile', label: 'audit.modules.library_profile', actions: ['', 'UPDATE'] },
];

const ACTION_OPTIONS = [
    { value: '', label: 'audit.operations.all' },
    { value: 'CREATE', label: 'audit.operations.create' },
    { value: 'UPDATE', label: 'audit.operations.update' },
    { value: 'DELETE', label: 'audit.operations.delete' },
    { value: 'LOGIN', label: 'audit.operations.login' },
    { value: 'RETURN', label: 'audit.operations.return' },
];

export function getAvailableActions(selectedModule: string) {
    if (selectedModule === '') {
        return ACTION_OPTIONS.map((action) => ({
            value: action.value,
            label: action.label,
        }));
    }
    const moduleConfig = MODULE_OPTIONS.find(m => m.value === selectedModule) || MODULE_OPTIONS[0];
    return ACTION_OPTIONS.filter(action => moduleConfig.actions.includes(action.value));
}

export function AuditTrailPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [pagination, setPagination] = useState<AuditPagination>({
        total: 0,
        offset: 0,
        limit: 20,
        totalPages: 1,
    });

    const [DataStatus, setDataStatus] = useState<DataStatus>('loading');

    const [filters, setFilters] = useState<GetAuditLogsParams>({
        limit: 20,
        offset: 0,
        search: '',
        module: '',
        action: '',
        startDate: '',
        endDate: '',
    });

    const [selectedLog, setSelectedLog] = useState<string | null>(null);
    const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState<boolean>(false);

    const fetchAuditLogs = useCallback(async () => {
        try {
            setDataStatus('loading');
            const response = await auditApi.getLogs(filters);
            setLogs(response.data);
            setPagination(response.pagination);
            setDataStatus('success');
        } catch (error) {
            console.error('Error al cargar logs de auditoría:', error);
            setDataStatus('error');
        }
    }, [filters]);

    useEffect(() => {
        fetchAuditLogs();
    }, [fetchAuditLogs]);

    useEffect(() => {
        if (!filters.module) return;

        const validActionForSelectedModule = getAvailableActions(filters.module);
        const isActionValid = validActionForSelectedModule.some((opt) => opt.value === filters.action);

        if (!isActionValid) {
            setFilters((prev) => ({
                ...prev,
                action: '',
                offset: 0
            }));
        }
    }, [filters.module]);

    const handleFilterChange = (key: keyof GetAuditLogsParams, value: any) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            offset: 0
        }));
    };

    const handleLimitChange = (newLimit: number) => {
        setFilters((prev) => ({
            ...prev,
            limit: newLimit,
            offset: 0
        }));
    };

    const handlePageChange = (newOffset: number) => {
        setFilters((prev) => ({
            ...prev,
            offset: newOffset
        }));
    };

    const renderActionBadge = (action: string) => {
        const act = action.toUpperCase();
        let badgeStyle = 'bg-gray-500/10 text-gray-500 border-gray-500/20';

        if (act.includes('CREATE') || act.includes('REGISTER')) badgeStyle = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
        else if (act.includes('UPDATE') || act.includes('EDIT')) badgeStyle = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
        else if (act.includes('DELETE') || act.includes('REMOVE')) badgeStyle = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
        else if (act.includes('LOGIN') || act.includes('AUTH')) badgeStyle = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${badgeStyle}`}>
                {firstCap(t(`audit.operations.${action.toLowerCase()}`))}
            </span>
        );
    };

    useEffect(() => {
        if (selectedLog && !isAuditLogModalOpen) {
            setIsAuditLogModalOpen(true);
        }
    }, [selectedLog, isAuditLogModalOpen]);

    return (
        <>
            {DataStatus === 'loading' ? (
                <div className="flex items-center justify-center w-full h-full gap-4">
                    <Spinner
                        size='md'
                        color='rgb(var(--color-primary-500))'
                    />
                    <span className='text-[rgb(var(--color-text))]'>
                        {firstCap(t('audit.loading'))}
                    </span>
                </div>
            ) : DataStatus === 'error' ? (
                <div className="flex items-center justify-center w-full h-full gap-4">
                    <ErrorState
                        title={firstCap(t('common.errorMessages.error'))}
                        message={firstCap(t('audit.errorLoadingLogs'))}
                        retryLabel={firstCap(t('common.actions.retry'))}
                        onRetry={fetchAuditLogs}
                    />
                </div>
            ) : (
                <div className="mx-auto p-6">
                    <SectionHeader
                        icon={'history'}
                        title={firstCap(t('audit.section'))}
                        description={firstCap(t('audit.description'))}
                    >
                    </SectionHeader>
                    <div className="mb-6 bg-[rgb(var(--color-bg))] p-3.5 rounded-2xl border border-[rgb(var(--color-border))]/50 shadow-xs space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
                            <DropDownMenu
                                options={MODULE_OPTIONS.map((module) => ({
                                    value: module.value,
                                    label: firstCap(t(module.label)),
                                }))}
                                onSelect={(val) => handleFilterChange('module', val)}
                                className="mt-0! w-full bg-[rgb(var(--color-bg-secondary))]/40 text-[rgb(var(--color-text))] rounded-md text-xs border border-[rgb(var(--color-border))]/50 transition-colors"
                                fontSize={'12px'}
                                height={'35px'}
                            >
                                {firstCap(t(MODULE_OPTIONS.find((opt) => opt.value === filters.module)?.label || 'All'))}
                            </DropDownMenu>
                            <DropDownMenu
                                options={getAvailableActions(filters.module || '').map((action) => ({
                                    value: action.value,
                                    label: firstCap(t(action.label)),
                                }))}
                                onSelect={(val) => handleFilterChange('action', val)}
                                className="mt-0! w-full bg-[rgb(var(--color-bg-secondary))]/40 text-[rgb(var(--color-text))] rounded-md text-xs border border-[rgb(var(--color-border))]/50 transition-colors"
                                fontSize={'12px'}
                                height={'35px'}
                            >
                                {firstCap(t(ACTION_OPTIONS.find((opt) => opt.value === filters.action)?.label || 'All'))}
                            </DropDownMenu>

                            <DateRangePicker
                                startDate={filters.startDate}
                                endDate={filters.endDate}
                                onChange={({ startDate, endDate }) => {
                                    setFilters((prev) => ({
                                        ...prev,
                                        startDate,
                                        endDate,
                                        page: 1,
                                    }));
                                }}
                            >
                                {filters.startDate ? filters.startDate : ''}
                                {filters.startDate || filters.endDate ? ' - ' : firstCap(t('common.date') || 'Fecha')}
                                {filters.endDate ? filters.endDate : ''}
                            </DateRangePicker>
                        </div>
                    </div>

                    <div className="bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))]/50 rounded-2xl shadow-xs overflow-hidden">
                        <div className="w-full overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-175">
                                <thead>
                                    <tr className="border-b border-[rgb(var(--color-border))]/40 bg-[rgb(var(--color-bg-secondary))]/30 text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                                        <th className="py-2 px-4">{firstCap(t('audit.tab.cols.user') || 'Usuario')}</th>
                                        <th className="py-2 px-4">{firstCap(t('audit.tab.cols.module') || 'Módulo')}</th>
                                        <th className="py-2 px-4">{firstCap(t('audit.tab.cols.action') || 'Acción')}</th>
                                        <th className="py-2 px-4">{firstCap(t('audit.tab.cols.ipAddress') || 'Origen / IP')}</th>
                                        <th className="py-2 px-4">{firstCap(t('audit.tab.cols.date') || 'Fecha y Hora')}</th>
                                        <th className="py-2 px-4 text-right">{firstCap(t('audit.tab.cols.actions') || 'Detalles')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgb(var(--color-border))]/30 text-xs">
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-16 text-center text-[rgb(var(--color-text-muted))]">
                                                <div className="flex flex-col items-center justify-center gap-2 max-w-xs mx-auto">
                                                    <span className="material-symbols-outlined text-4xl text-[rgb(var(--color-text-muted))]/40">
                                                        search_off
                                                    </span>
                                                    <p className="font-medium text-sm text-[rgb(var(--color-text))]">No hay registros</p>
                                                    <p className="text-xs">No se encontraron eventos de auditoría con los filtros seleccionados.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((item) => {
                                            const userFullName = item.user
                                                ? `${item.user.firstName} ${item.user.lastName}`.trim()
                                                : 'Sistema / Desconocido';

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className="animate-fade-in hover:bg-[rgb(var(--color-bg-secondary))]/40 transition-colors group"
                                                >
                                                    <td className="py-2 px-4">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <UserAvatar
                                                                fullName={userFullName}
                                                                className="w-10! h-10! shrink-0 rounded-full border border-[rgb(var(--color-border))]/60 shadow-2xs"
                                                            />
                                                            <div className="flex flex-col min-w-0">
                                                                {(() => {

                                                                    const isButton = !!item.user;

                                                                    return (
                                                                        <Button
                                                                            variant='default'
                                                                            className={`text-(length:--fs-caption) text-[rgb(var(--color-text))] font-medium truncate  transition-colors p-0! 
                                                                            ${!isButton ? 'group-hover:text-[rgb(var(--color-primary-500))] cursor-pointer' : 'pointer-events-none cursor-default'}
                                                                            `}
                                                                            onClick={() => isButton && navigate(`/users/edit/${item.user?.id}`)}
                                                                        >
                                                                            {item.user?.username ? (
                                                                                item.user?.username
                                                                            ) : (
                                                                                <span className='uppercase text-[rgb(var(--color-text-muted))] font-mono'>
                                                                                    {t('common.unknown')}
                                                                                </span>
                                                                            )}
                                                                        </Button>
                                                                    )
                                                                })()}
                                                                {item.user?.role?.name &&
                                                                    <span className="text-[10px] text-[rgb(var(--color-text-muted))] truncate">
                                                                        {firstCap(item.user?.role?.name)}
                                                                    </span>
                                                                }
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="py-2 px-4">
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-semibold text-[rgb(var(--color-text))]">
                                                                {firstCap(t(`audit.modules.${item.module.toLowerCase()}`))}
                                                            </span>
                                                            {item.entityId && (
                                                                <span className="text-[10px] text-[rgb(var(--color-text-muted))] font-mono">
                                                                    ID: #{item.entityId}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="py-2 px-4">
                                                        {renderActionBadge(item.action.toLowerCase())}
                                                    </td>

                                                    <td className="py-2 px-4">
                                                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[rgb(var(--color-bg-secondary))]/60 text-[rgb(var(--color-text-muted))] border border-[rgb(var(--color-border))]/30 uppercase">
                                                            {item.ipAddress || t('common.unknown')}
                                                        </span>
                                                    </td>

                                                    <td className="py-2 px-4 text-[rgb(var(--color-text-muted))] whitespace-nowrap">
                                                        {new Date(item.createdAt).toLocaleString(undefined, {
                                                            timeZone: localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone,
                                                            dateStyle: 'short',
                                                            timeStyle: 'medium',
                                                        })}
                                                    </td>

                                                    <td className="py-2 px-4 text-right">
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => setSelectedLog(item.id)}
                                                            className="aspect-square! rounded-lg hover:bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-500))] border border-transparent hover:border-[rgb(var(--color-border))]/50 transition-all"
                                                            tooltip={{
                                                                text: firstCap(t('audit.tab.visibilityButtonToolTip')),
                                                                className: 'text-[10px]'
                                                            }}
                                                        >
                                                            <span className="material-symbols-outlined text-lg block">visibility</span>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationFooter
                            limitOptions={[10, 20, 50, 100, 200]}
                            limit={filters.limit || 20}
                            offset={filters.offset || 0}
                            totalItems={pagination.total}
                            onLimitChange={(limit) => handleLimitChange(Number(limit))}
                            onPageChange={(offset: number) => handlePageChange(offset)}
                            resultsCountText={`${logs.length} / ${pagination.total} ${firstCap(t('common.results'))}`}
                            resultsPerPageLabel={
                                <span className='text-(length:--fs-caption) text-[rgb(var(--color-text-muted))]'>
                                    {firstCap(t('common.resultsPerPage'))}
                                </span>
                            }
                        />
                    </div>

                    <AuditLogModal
                        isOpen={isAuditLogModalOpen}
                        onClose={() => {
                            setIsAuditLogModalOpen(false);
                            setSelectedLog(null);
                        }}
                        logId={selectedLog}
                    />
                </div>
            )}
        </>
    );
}