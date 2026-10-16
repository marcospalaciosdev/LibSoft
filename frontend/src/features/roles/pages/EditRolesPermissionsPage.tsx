import { useEffect, useState, Fragment, useMemo } from 'react';
import type { RoleResponseDto, PermissionItem, DataStatus } from '@LibSoft/shared-types';

import { firstCap } from '@/shared/utils/firstCap';
import { Button, Spinner } from '@/shared/components/ui';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '@/shared/components/feedback';
import { rolesApi } from '../api/roles.api';

const ModuleIcons: Record<string, string> = {
    books: 'book',
    loans: 'swap_horiz',
    borrowers: 'person_search',
    users: 'person',
    settings: 'settings',
    maintenance: 'build',
    audit: 'rule',
    help: 'help',
    roles: 'manage_accounts',
    library_profile: 'book_ribbon',
};

const FIRST_COL_WIDTH = '260px';
const ROLE_COL_WIDTH = '145px';

export function EditRolesPermissionsPage() {
    const { t, i18n } = useTranslation();

    const [rolesData, setRolesData] = useState<RoleResponseDto[]>([]);
    const [modulesList, setModulesList] = useState<Record<string, { actionId: number; action: string }[]>>({});
    const [activePermissions, setActivePermissions] = useState<Record<string, Record<number, boolean>>>({});

    const [dataStatus, setDataStatus] = useState<DataStatus>('idle');
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

    async function loadRolesMatrix() {
        try {
            setDataStatus('loading');
            const [rolesResult, allPermissions]: [RoleResponseDto[], PermissionItem[]] = await Promise.all([
                rolesApi.getRoles({
                    lang: i18n.language,
                    includePermissions: true,
                    includeAdmin: false,
                    users: true,
                    usersLimit: 5,
                }),
                rolesApi.getAllPermissions(),
            ]);

            setRolesData(rolesResult);

            const modulesMap: Record<string, Map<number, string>> = {};
            allPermissions.forEach((perm) => {
                if (!modulesMap[perm.module]) {
                    modulesMap[perm.module] = new Map();
                }
                modulesMap[perm.module].set(perm.actionId, perm.action);
            });

            const permissionsState: Record<string, Record<number, boolean>> = {};
            rolesResult.forEach((role) => {
                permissionsState[role.id.toString()] = {};
                role.permissions?.forEach((perm) => {
                    permissionsState[role.id.toString()][perm.permissionId] = true;
                });
            });

            const formattedModules: Record<string, { actionId: number; action: string }[]> = {};
            const initialOpenState: Record<string, boolean> = {};

            Object.keys(modulesMap).forEach((mod) => {
                formattedModules[mod] = Array.from(modulesMap[mod], ([actionId, action]) => ({ actionId, action }));
                initialOpenState[mod] = false;
            });

            setModulesList(formattedModules);
            setActivePermissions(permissionsState);
            setOpenModules(initialOpenState);
            setDataStatus('success');
        } catch (error) {
            console.error('Error al obtener la matriz de roles y permisos:', error);
            setDataStatus('error');
        }
    }

    useEffect(() => { loadRolesMatrix() }, [i18n.language]);

    const toggleModule = (moduleName: string) => {
        setOpenModules((prev) => ({
            ...prev,
            [moduleName]: !prev[moduleName],
        }));
    };

    const areAllOpen = useMemo(() => {
        const keys = Object.keys(modulesList);
        return keys.length > 0 && keys.every((k) => !!openModules[k]);
    }, [modulesList, openModules]);

    const toggleAllModules = () => {
        const nextState = !areAllOpen;
        const updated: Record<string, boolean> = {};
        Object.keys(modulesList).forEach((mod) => {
            updated[mod] = nextState;
        });
        setOpenModules(updated);
    };

    const handleToggle = (roleId: string, permissionId: number) => {
        setActivePermissions((prev) => ({
            ...prev,
            [roleId]: {
                ...(prev[roleId] ?? {}),
                [permissionId]: !prev[roleId]?.[permissionId],
            },
        }));
        setIsDirty(true);
    };

    const handleSaveChanges = async () => {
        try {
            setIsSaving(true);
            await rolesApi.updatePermissionsMatrix(activePermissions);
            setIsDirty(false);
        } catch (error) {
            console.error('Error al guardar la matriz de permisos:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            {dataStatus === "error" ? (
                <ErrorState
                    message={firstCap(t('roles.permissionsMatrix.errors.failedToLoad'))}
                    retryLabel={firstCap(t('common.actions.retry'))}
                    onRetry={loadRolesMatrix}
                />
            ) : dataStatus === "loading" ? (
                <div className="flex items-center justify-center h-full w-full gap-4">
                    <Spinner />
                    <span className="text-sm text-[rgb(var(--color-text-muted))] font-medium">
                        {t('roles.permissionsMatrix.loading')}
                    </span>
                </div>
            ) : dataStatus === "success" ? (
                <div className="flex flex-col w-full h-full relative overflow-y-auto select-none">
                    <div className="flex flex-row justify-between p-5 border-b border-[rgb(var(--color-border))]/60 shrink-0">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[rgb(var(--color-primary-500))]/10 text-[rgb(var(--color-primary-500))] border border-[rgb(var(--color-primary-500))]/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-primary-500))] animate-pulse" />
                                    Control de Acceso
                                </span>
                                <span className="text-xs text-[rgb(var(--color-text-muted))]">· Matriz Granular</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[rgb(var(--color-text))] flex items-center gap-2">
                                <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] text-2xl select-none">
                                    security
                                </span>
                                Matriz de Permisos por Rol
                            </h1>
                            <p className="text-xs sm:text-sm text-[rgb(var(--color-text-muted))]">
                                Configurá las capacidades y acciones permitidas para cada perfil del sistema.
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleAllModules}
                                className="rounded-xl border border-[rgb(var(--color-border))]/80 text-xs font-medium px-3 py-2 text-[rgb(var(--color-text))]"
                                leftIcon={
                                    <div className='flex flex-col items-center'>
                                        <span className={`material-symbols-outlined h-fit transition-transform duration-300 ${areAllOpen ? 'rotate-180' : ''}`}>
                                            keyboard_arrow_up
                                        </span>
                                        <span className={`material-symbols-outlined h-fit transition-transform duration-300 ${areAllOpen ? 'rotate-180' : ''}`}>
                                            keyboard_arrow_down
                                        </span>
                                    </div>
                                }
                            >
                                {areAllOpen ? 'Colapsar todo' : 'Expandir todo'}
                            </Button>

                            {isDirty && (
                                <Button
                                    onClick={handleSaveChanges}
                                    variant="primary"
                                    size="sm"
                                    disabled={isSaving}
                                    className="rounded-xl text-xs px-4 py-2 shadow-xs transition-all hover:shadow-md animate-in fade-in"
                                    leftIcon={
                                        isSaving ? (
                                            <Spinner className="w-3.5 h-3.5" color="white" />
                                        ) : (
                                            <span className="material-symbols-outlined text-base">save</span>
                                        )
                                    }
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            )}
                        </div>
                    </div>

                    {isDirty && (
                        <div className="sticky top-0 z-50 flex justify-between items-center px-6 md:px-8 py-2.5 bg-linear-to-r from-[rgb(var(--color-primary-500))]/15 via-[rgb(var(--color-bg))] to-[rgb(var(--color-bg))] shadow-xs transition-all duration-200">
                            <div className="flex items-center gap-2.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[rgb(var(--color-primary-500))] opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[rgb(var(--color-primary-500))]" />
                                </span>
                                <span className="text-xs font-semibold text-[rgb(var(--color-text))]">
                                    Tenés modificaciones pendientes en la matriz sin guardar
                                </span>
                            </div>
                            <Button
                                onClick={handleSaveChanges}
                                variant="primary"
                                size="sm"
                                disabled={isSaving}
                                className="rounded-md text-(length:--fs-caption)"
                                leftIcon={
                                    isSaving ? (
                                        <Spinner className="w-3.5 h-3.5" color="white" />
                                    ) : (
                                        <span className="material-symbols-outlined text-sm">save</span>
                                    )
                                }
                            >
                                {isSaving ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </div>
                    )}
                    <div className="relative z-10 w-full overflow-x-auto flex-1 ">
                        <div className="min-w-max w-full border-collapse">
                            <div className="flex items-center uppercase tracking-wider h-14 sticky top-0 z-40 backdrop-blur-md border-b border-[rgb(var(--color-border))]/60 shadow-xs">
                                <div
                                    className="px-6 text-[11px] font-bold text-[rgb(var(--color-text-muted))] sticky left-0 z-50  h-full flex items-center justify-between border-r border-[rgb(var(--color-border))]/60 shrink-0"
                                    style={{ width: FIRST_COL_WIDTH }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base text-[rgb(var(--color-primary-500))]">
                                            tune
                                        </span>
                                        <span>Módulo / Acción</span>
                                    </div>
                                </div>
                                {rolesData.map((role) => {
                                    const activeCount = Object.values(activePermissions[role.id.toString()] || {}).filter(Boolean).length;
                                    return (
                                        <div
                                            key={role.id.toString()}
                                            className="px-3 py-2 text-center shrink-0 flex flex-col items-center justify-center h-full border-r border-[rgb(var(--color-border))]/50 last:border-r-0"
                                            style={{ width: ROLE_COL_WIDTH }}
                                        >
                                            <span className="font-bold text-xs text-[rgb(var(--color-text))] truncate max-w-32.5">
                                                {firstCap(role.name)}
                                            </span>
                                            <span className="text-[10px] font-medium text-[rgb(var(--color-text-muted))] mt-0.5">
                                                {activeCount} permisos
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="relative divide-[rgb(var(--color-border))]/40">
                                {Object.entries(modulesList).map(([moduleName, actions]) => {
                                    const isOpen = !!openModules[moduleName];
                                    return (
                                        <Fragment key={moduleName}>
                                            <div className="flex items-center w-full border-b border-[rgb(var(--color-border))]">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleModule(moduleName)}
                                                    className={`w-full text-left flex items-center cursor-pointer select-none font-semibold transition-all duration-150 py-2.5 ${isOpen
                                                        ? 'bg-[rgb(var(--color-primary-500))]/5 hover:bg-[rgb(var(--color-primary-500))]/8'
                                                        : ' hover:bg-[rgb(var(--color-bg-secondary))]/50'
                                                        }`}
                                                >
                                                    <div
                                                        className="sticky left-0 z-30 flex items-center px-6 w-fit shrink-0"
                                                        style={{ width: FIRST_COL_WIDTH }}
                                                    >
                                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[rgb(var(--color-primary-500))]/10 text-[rgb(var(--color-primary-500))] mr-3 shrink-0">
                                                            <span className="material-symbols-outlined text-base">
                                                                {ModuleIcons[moduleName] || 'extension'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-baseline gap-1.5 mr-auto min-w-0">
                                                            <span className="text-[rgb(var(--color-text))] font-semibold text-xs tracking-tight truncate">
                                                                {firstCap(t(`users.modules.${moduleName}`, { defaultValue: moduleName }))}
                                                            </span>
                                                            <span className="text-[10px] font-normal text-[rgb(var(--color-text-muted))]">
                                                                ({actions.length})
                                                            </span>
                                                        </div>
                                                        <span
                                                            className={`material-symbols-outlined text-base text-[rgb(var(--color-text-muted))] transition-transform duration-200 ${isOpen ? 'rotate-90 text-[rgb(var(--color-primary-500))]' : ''
                                                                }`}
                                                        >
                                                            chevron_right
                                                        </span>
                                                    </div>
                                                </button>
                                            </div>
                                            <div
                                                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                                                    }`}
                                            >
                                                <div className={isOpen ? 'overflow-visible divide-y divide-[rgb(var(--color-border))]/25' : 'overflow-hidden'}>
                                                    {actions.map(({ actionId, action }) => (
                                                        <div
                                                            key={`${moduleName}-${actionId}`}
                                                            className="flex items-center  hover:bg-[rgb(var(--color-bg-secondary))]/40 transition-colors duration-150 group"
                                                        >
                                                            <div
                                                                className="py-2.5 px-6 pl-14 text-[rgb(var(--color-text))] text-xs font-medium sticky left-0 z-20  group-hover:bg-[rgb(var(--color-bg-secondary))]/80 h-full flex items-center border-r border-[rgb(var(--color-border))]/60 shrink-0 transition-colors"
                                                                style={{ width: FIRST_COL_WIDTH }}
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-primary-500))]/50 mr-2.5 shrink-0" />
                                                                <span className="truncate">
                                                                    {firstCap(t(`users.permissions.${action}`, { defaultValue: action }))}
                                                                </span>
                                                            </div>

                                                            {rolesData.map((role) => {
                                                                const isChecked = !!activePermissions[role.id.toString()]?.[actionId];
                                                                const isProtectedRole = role.id.toString() === '1' || role.name.toLowerCase() === 'admin';

                                                                return (
                                                                    <div
                                                                        key={role.id.toString()}
                                                                        className="py-2.5 px-3 flex justify-center items-center shrink-0 border-r border-[rgb(var(--color-border))]/40 last:border-r-0"
                                                                        style={{ width: ROLE_COL_WIDTH }}
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            role="checkbox"
                                                                            aria-checked={isChecked}
                                                                            disabled={isProtectedRole}
                                                                            aria-label={`Permiso ${action} en ${moduleName} para el rol ${role.name}`}
                                                                            onClick={() => !isProtectedRole && handleToggle(role.id.toString(), actionId)}
                                                                            className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all duration-150 select-none ${isProtectedRole
                                                                                ? 'opacity-35 cursor-not-allowed border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-muted))]'
                                                                                : isChecked
                                                                                    ? 'bg-[rgb(var(--color-primary-500))] border-[rgb(var(--color-primary-500))] text-white shadow-xs hover:bg-[rgb(var(--color-primary-600))] cursor-pointer active:scale-90'
                                                                                    : 'border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary-500))]/70 hover:bg-[rgb(var(--color-bg-secondary))] cursor-pointer active:scale-90'
                                                                                }`}
                                                                        >
                                                                            {isChecked && (
                                                                                <span className="material-symbols-outlined text-sm font-bold leading-none">
                                                                                    check
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null
            }
        </>
    );
}