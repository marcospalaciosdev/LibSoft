import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usersApi } from "@/features/users/api/users.api";
import { firstCap } from "@/shared/utils/firstCap";
import { Button, Spinner, UserAvatar, Badge, SearchBar } from "@/shared/components/ui";
import { ErrorState } from "@/shared/components/feedback";
import type { RoleResponseDto, PermissionItem, DataStatus } from "@LibSoft/shared-types";
import { rolesApi } from "../api/roles.api";

import { Permission } from "@/hooks/usePermissions";

export function RolesDashboard() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [roles, setRoles] = useState<RoleResponseDto[]>([]);
    const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
    const [totalUsers, setTotalUsers] = useState<number>(0);
    const [dataStatus, setDataStatus] = useState<DataStatus>('idle');

    const [permissionsManagementTutorialIsOpen, setPermissionsManagementTutorialIsOpen] = useState<boolean>(
        !!localStorage.getItem('permissionsManagementTutorialIsOpen')
    );

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [filterCategory, setFilterCategory] = useState<'all' | 'with-users' | 'admin'>('all');
    const [hoveredUser, setHoveredUser] = useState<string>('');

    const fetchDashboardData = async () => {
        try {
            setDataStatus('loading');
            const [rolesData, permissionsData, usersCount] = await Promise.all([
                rolesApi.getRoles({
                    lang: i18n.language,
                    users: true,
                    usersLimit: 6,
                    includeAdmin: true,
                    includePermissions: true,
                }),

                rolesApi.getAllPermissions().catch(() => [] as PermissionItem[]),
                usersApi.getCount().catch(() => 0),
            ]);

            setRoles(rolesData);
            setAllPermissions(permissionsData);
            setTotalUsers(usersCount);

            setDataStatus('success');
        } catch (error) {
            console.error('Error fetching roles dashboard data:', error);
            setDataStatus('error');
        }
    };

    useEffect(() => { fetchDashboardData() }, [i18n.language]);

    const filteredRoles = useMemo(() => {
        return roles.filter((role) => {
            const matchesSearch =
                role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()));

            if (!matchesSearch) return false;

            if (filterCategory === 'with-users') {
                return (role.usersPreview?.length ?? 0) > 0;
            }
            if (filterCategory === 'admin') {
                return role.slug.toLowerCase().includes('admin');
            }
            return true;
        });
    }, [roles, searchQuery, filterCategory]);

    const totalSystemPermissions = allPermissions.length || 32;

    return (
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden p-6 md:p-8 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[rgb(var(--color-border))]/50">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[rgb(var(--color-primary-500))]/10 text-[rgb(var(--color-primary-500))] border border-[rgb(var(--color-primary-500))]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-primary-500))] animate-pulse" />
                            {t('roles.badge')}
                        </span>
                        <span className="text-xs text-[rgb(var(--color-text-muted))]">
                            · {t('roles.subtitleSystem')}
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[rgb(var(--color-text))] flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] text-2xl sm:text-3xl select-none">
                            shield_person
                        </span>
                        {t('roles.dashboard.title')}
                    </h1>
                    <p className="text-(length:--fs-caption) text-[rgb(var(--color-text-muted))] max-w-2xl">
                        {t('roles.dashboard.subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchDashboardData()}
                        disabled={dataStatus === 'loading'}
                        isLoading={dataStatus === 'loading'}
                        className="rounded-md border border-[rgb(var(--color-border))]/80 hover:bg-[rgb(var(--color-bg-secondary))] text-xs font-medium px-3.5 py-2 text-[rgb(var(--color-text))]"
                        leftIcon={
                            <span className={`material-symbols-outlined text-sm`}>
                                refresh
                            </span>
                        }
                    >
                        {t('roles.actions.refresh')}
                    </Button>
                    <Permission permissions="roles.update">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('permissions')}
                            className="rounded-md shadow-sm text-xs font-semibold px-4 py-2 flex items-center gap-1.5 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                            leftIcon={<span className="material-symbols-outlined text-base">tune</span>}
                        >
                            {firstCap(t('roles.actions.editMatrix'))}
                        </Button>
                    </Permission>
                    <Permission permissions="roles.create" >
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('add')}
                            className="rounded-md shadow-sm text-xs font-semibold px-4 py-2 flex items-center gap-1.5 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                            leftIcon={<span className="material-symbols-outlined text-base">add</span>}
                        >
                            {firstCap(t('roles.actions.addRole'))}
                        </Button>
                    </Permission>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative overflow-hidden rounded-2xl border border-[rgb(var(--color-border))]/70 bg-[rgb(var(--color-bg))] p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-[rgb(var(--color-primary-500))]/40 group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
                            {t('roles.metrics.totalRoles')}
                        </span>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgb(var(--color-primary-500))]/10 text-[rgb(var(--color-primary-500))] group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-xl">manage_accounts</span>
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-[rgb(var(--color-text))]">
                            {dataStatus !== 'success' ? '--' : roles.length}
                        </span>
                        <span className="text-xs font-medium text-emerald-500 flex items-center">
                            <span className="material-symbols-outlined text-xs mr-0.5">check_circle</span>
                            {t('roles.metrics.activeStatus')}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
                        {t('roles.metrics.rolesConfiguredSubtitle')}
                    </p>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-[rgb(var(--color-border))]/70 bg-[rgb(var(--color-bg))] p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-[rgb(var(--color-primary-500))]/40 group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
                            {t('roles.metrics.totalPermissions')}
                        </span>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-xl">key</span>
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-[rgb(var(--color-text))]">
                            {dataStatus !== 'success' ? '--' : totalSystemPermissions}
                        </span>
                        <span className="text-xs font-medium text-[rgb(var(--color-text-muted))]">
                            {t('roles.metrics.capabilities')}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
                        {t('roles.metrics.permissionsSubtitle')}
                    </p>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-[rgb(var(--color-border))]/70 bg-[rgb(var(--color-bg))] p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-[rgb(var(--color-primary-500))]/40 group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
                            {t('roles.metrics.assignedUsers')}
                        </span>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-xl">group</span>
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-[rgb(var(--color-text))]">
                            {dataStatus !== 'success' ? '--' : totalUsers}
                        </span>
                        <span className="text-xs font-medium text-emerald-500">
                            {t('roles.metrics.registeredAccounts')}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
                        {t('roles.metrics.usersSubtitle')}
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-xl border border-[rgb(var(--color-border))]/60">
                <div className="flex flex-1 items-center gap-2">
                    <SearchBar
                        placeholder={t('roles.filters.searchPlaceholder')}
                        initialValue={searchQuery}
                        onChange={(val) => setSearchQuery(val)}
                        className="w-full bg-[rgb(var(--color-bg))] rounded-md h-10 border-[rgb(var(--color-border))]/80"
                    />

                    <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-[rgb(var(--color-border))]/60">
                        <Button
                            variant="unstyled"
                            isDisabled={dataStatus !== 'success'}
                            onClick={() => setFilterCategory('all')}
                            className={`px-3 py-1.5 text-nowrap rounded-md cursor-pointer text-xs font-medium transition-all ${filterCategory === 'all'
                                ? 'bg-[rgb(var(--color-primary-500))] text-white shadow-xs'
                                : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg-secondary))]'
                                }`}
                        >
                            {t('roles.filters.all')} ({roles.length})
                        </Button>
                        <Button
                            variant="unstyled"
                            isDisabled={dataStatus !== 'success'}
                            onClick={() => setFilterCategory('with-users')}
                            className={`px-3 py-1.5 text-nowrap rounded-md cursor-pointer text-xs font-medium transition-all ${filterCategory === 'with-users'
                                ? 'bg-[rgb(var(--color-primary-500))] text-white shadow-xs'
                                : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg-secondary))]'
                                }`}
                        >
                            {t('roles.filters.withUsers')}
                        </Button>
                        <Button
                            variant="unstyled"
                            isDisabled={dataStatus !== 'success'}
                            onClick={() => setFilterCategory('admin')}
                            className={`px-3 py-1.5 text-nowrap rounded-md cursor-pointer text-xs font-medium transition-all ${filterCategory === 'admin'
                                ? 'bg-[rgb(var(--color-primary-500))] text-white shadow-xs'
                                : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg-secondary))]'
                                }`}
                        >
                            {t('roles.filters.admin')}
                        </Button>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                    {dataStatus === 'success' && (
                        <span className="text-xs text-[rgb(var(--color-text-muted))] mr-2 hidden lg:inline">
                            {filteredRoles.length === 1
                                ? t('roles.filters.showingRole', { count: filteredRoles.length })
                                : t('roles.filters.showingRoles', { count: filteredRoles.length })}
                        </span>
                    )}
                    <div className="flex items-center gap-1 bg-[rgb(var(--color-bg))] p-1.5 rounded-md border border-[rgb(var(--color-border))]/60 shadow-xs">
                        <Button
                            variant="unstyled"
                            onClick={() => setViewMode('cards')}
                            tooltip={{
                                text: t('roles.filters.viewCards')
                            }}
                            className={`cursor-pointer rounded-sm p-1.5 aspect-square! transition-colors flex items-center justify-center ${viewMode === 'cards'
                                ? 'bg-[rgb(var(--color-primary-500))]/15 text-[rgb(var(--color-primary-500))] font-semibold'
                                : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'
                                }`}
                        >
                            <span className="material-symbols-outlined text-(length:--fs-icon-sm) select-none">grid_view</span>
                        </Button>
                        <Button
                            variant="unstyled"
                            onClick={() => setViewMode('table')}
                            tooltip={{
                                text: t('roles.filters.viewTable')
                            }}
                            className={`cursor-pointer rounded-sm p-1.5 aspect-square! transition-colors flex items-center justify-center ${viewMode === 'table'
                                ? 'bg-[rgb(var(--color-primary-500))]/15 text-[rgb(var(--color-primary-500))] font-semibold'
                                : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'
                                }`}
                        >
                            <span className="material-symbols-outlined text-(length:--fs-icon-sm) select-none">table_rows</span>
                        </Button>
                    </div>
                </div>
            </div>

            {dataStatus === 'loading' ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Spinner color="rgb(var(--color-primary-500))" className="w-10 h-10" />
                    <span className="text-sm text-[rgb(var(--color-text-muted))] font-medium">
                        {t('roles.states.loading')}
                    </span>
                </div>
            ) : dataStatus === 'error' ? (
                viewMode === 'cards' ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-[rgb(var(--color-border))]/70 bg-[rgb(var(--color-bg))] shadow-xs min-h-80">
                        <ErrorState
                            title={firstCap(t('roles.states.errorTitle'))}
                            message={firstCap(t('roles.states.errorMessageCards'))}
                            retryLabel={firstCap(t('roles.actions.retry'))}
                            onRetry={() => fetchDashboardData()}
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-[rgb(var(--color-border))]/70 bg-[rgb(var(--color-bg))] shadow-xs">
                        <table className="min-w-full divide-y divide-[rgb(var(--color-border))]/50 text-left">
                            <thead className="bg-[rgb(var(--color-bg-secondary))]/40 text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
                                <tr>
                                    <th className="px-6 py-3.5">{t('roles.table.role')}</th>
                                    <th className="px-6 py-3.5">{t('roles.table.type')}</th>
                                    <th className="px-6 py-3.5">{t('roles.table.description')}</th>
                                    <th className="px-6 py-3.5">{t('roles.table.permissions')}</th>
                                    <th className="px-6 py-3.5">{t('roles.table.users')}</th>
                                    <th className="px-6 py-3.5 text-right">{t('roles.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgb(var(--color-border))]/30 text-xs">
                                <tr>
                                    <td colSpan={6} className="py-16 px-4">
                                        <ErrorState
                                            title={firstCap(t('roles.states.errorTitle'))}
                                            message={firstCap(t('roles.states.errorMessageTable'))}
                                            retryLabel={firstCap(t('roles.actions.retry'))}
                                            onRetry={() => fetchDashboardData()}
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )
            ) : filteredRoles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-muted))] mb-3">
                        <span className="material-symbols-outlined text-2xl">search_off</span>
                    </div>
                    <h3 className="text-base font-semibold text-[rgb(var(--color-text))]">
                        {t('roles.states.emptyTitle')}
                    </h3>
                    <p className="text-xs text-[rgb(var(--color-text-muted))] max-w-sm mt-1 mb-4">
                        {t('roles.states.emptySubtitle')}
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSearchQuery('');
                            setFilterCategory('all');
                        }}
                        className="text-xs rounded-xl border border-[rgb(var(--color-border))]"
                    >
                        {t('roles.actions.clearFilters')}
                    </Button>
                </div>
            ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredRoles.map((role) => {
                        const permissionsCount = role.permissions?.length ?? 0;
                        const permissionsPercentage = totalSystemPermissions > 0
                            ? Math.round((permissionsCount / totalSystemPermissions) * 100)
                            : 0;

                        return (
                            <div
                                key={role.id.toString()}
                                className="group relative flex flex-col justify-between rounded-2xl border border-[rgb(var(--color-border))]/70 bg-[rgb(var(--color-bg))] p-6 shadow-xs transition-all duration-200 hover:shadow-lg hover:border-[rgb(var(--color-primary-500))]/40 hover:-translate-y-0.5"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="min-w-0">
                                                <h3 className="text-base font-bold text-[rgb(var(--color-text))] truncate">
                                                    {firstCap(role.name)}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[11px] text-[rgb(var(--color-text-muted))] font-medium">
                                                        ID #{role.id.toString()}
                                                    </span>
                                                    {role.slug.toLowerCase().includes('admin') && (
                                                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                                            {t('roles.card.rootTag')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <Badge
                                            style={{
                                                color: `rgb(${role.colorRGB})`,
                                                backgroundColor: `rgba(${role.colorRGB}, 0.15)`,
                                            }}
                                            className={`shrink-0 text-[11px] text-shadow-2xs`}>
                                            {role.type === 'default'
                                                ? t('roles.card.system')
                                                : t('roles.card.custom')}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-[rgb(var(--color-text-muted))] line-clamp-2 min-h-8 leading-relaxed">
                                        {role.description || t('roles.card.noDescription')}
                                    </p>
                                    <div className="space-y-1.5 pt-2 border-t border-[rgb(var(--color-border))]/40">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-medium text-[rgb(var(--color-text-muted))] flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm text-[rgb(var(--color-primary-500))]">
                                                    verified
                                                </span>
                                                {t('roles.card.activePermissions')}
                                            </span>
                                            <span className="font-semibold text-[rgb(var(--color-text))]">
                                                {permissionsCount}
                                                <span
                                                    className="text-[rgb(var(--color-text-muted))] font-normal"> / {totalSystemPermissions} ({permissionsPercentage}%)</span>
                                            </span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-[rgb(var(--color-bg-secondary))] overflow-hidden">
                                            <div
                                                style={{
                                                    background: `rgb(${role.colorRGB})`,
                                                    width: `${Math.min(permissionsPercentage, 100)}%`
                                                }}
                                                className={`h-full rounded-full transition-all duration-500`}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--color-text-muted))] block mb-2">
                                            {t('roles.card.assignedUsersCount', {
                                                count: role.usersPreview?.length ?? 0,
                                            })}
                                        </span>
                                        {role.usersPreview && role.usersPreview.length > 0 ? (
                                            <div className="flex items-center flex-wrap gap-1">
                                                <div className="flex items-center">
                                                    {role.usersPreview.slice(0, 5).map((user, idx) => (
                                                        <div
                                                            key={user.id}
                                                            className="relative group/user"
                                                            style={{
                                                                marginLeft: idx === 0 ? '0px' : '-8px',
                                                                zIndex: hoveredUser === user.id ? 50 : 5 - idx,
                                                            }}
                                                        >
                                                            <UserAvatar
                                                                onMouseEnter={() => setHoveredUser(user.id)}
                                                                onMouseLeave={() => setHoveredUser('')}
                                                                avatarUrl={user.avatarUrl}
                                                                fullName={user.fullName}
                                                                className="w-8! h-8! border-2 border-[rgb(var(--color-bg))] shadow-xs transition-transform duration-200 hover:scale-115 cursor-pointer"
                                                            />

                                                            {hoveredUser === user.id && (
                                                                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col min-w-48 bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))] rounded-xl border border-[rgb(var(--color-border))] shadow-2xl p-2.5 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                                                                    <div className="flex items-center gap-2">
                                                                        <UserAvatar
                                                                            avatarUrl={user.avatarUrl}
                                                                            fullName={user.fullName}
                                                                            className="w-7! h-7!"
                                                                        />
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="font-semibold text-xs truncate">
                                                                                {firstCap(user.fullName)}
                                                                            </span>
                                                                            <span className="text-[10px] text-[rgb(var(--color-text-muted))] truncate">
                                                                                {user.username ? `@${user.username}` : t('roles.card.userRoleFallback')}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                {role.usersPreview.length > 5 && (
                                                    <span className="text-[11px] font-medium text-[rgb(var(--color-text-muted))] ml-1">
                                                        {t('roles.card.moreUsers', {
                                                            count: role.usersPreview.length - 5,
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-[rgb(var(--color-text-muted))] italic">
                                                {t('roles.card.noUsers')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-[rgb(var(--color-border))]/50 flex items-center justify-between">
                                    <span className="text-xs text-[rgb(var(--color-text-muted))] flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">shield</span>
                                        {t('roles.card.level', {
                                            level: role.slug.toLowerCase() === 'administrator'
                                                ? t('roles.card.levelFull')
                                                : t('roles.card.levelStandard'),
                                        })}
                                    </span>
                                    {role.slug !== 'administrator' ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigate('permissions')}
                                            className="text-xs font-semibold text-[rgb(var(--color-primary-500))] hover:bg-[rgb(var(--color-primary-500))]/10 rounded-lg px-2.5 py-1.5 group-hover:translate-x-0.5 transition-all"
                                            rightIcon={<span className="material-symbols-outlined text-sm">chevron_right</span>}
                                        >
                                            {t('roles.actions.edit')}
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-[rgb(var(--color-border))]/70 bg-[rgb(var(--color-bg))] shadow-xs">
                    <table className="min-w-full divide-y divide-[rgb(var(--color-border))]/50 text-left">
                        <thead className="bg-[rgb(var(--color-bg-secondary))]/40 text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
                            <tr>
                                <th className="px-6 py-3.5">{t('roles.table.role')}</th>
                                <th className="px-6 py-3.5">{t('roles.table.type')}</th>
                                <th className="px-6 py-3.5">{t('roles.table.description')}</th>
                                <th className="px-6 py-3.5">{t('roles.table.permissions')}</th>
                                <th className="px-6 py-3.5">{t('roles.table.users')}</th>
                                <th className="px-6 py-3.5 text-right">{t('roles.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgb(var(--color-border))]/30 text-xs">
                            {filteredRoles.map((role) => {
                                const permCount = role.permissions?.length ?? 0;
                                const permPct = totalSystemPermissions > 0
                                    ? Math.round((permCount / totalSystemPermissions) * 100)
                                    : 0;

                                return (
                                    <tr
                                        key={role.id.toString()}
                                        className="hover:bg-[rgb(var(--color-bg-secondary))]/40 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <span className="font-bold text-[rgb(var(--color-text))] text-sm block">
                                                        {firstCap(role.name)}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge
                                                style={{
                                                    backgroundColor: `rgba(${role.colorRGB}, 0.1)`,
                                                    color: `rgb(${role.colorRGB})`
                                                }}
                                                className="text-[10px]">
                                                {role.type === 'default'
                                                    ? t('roles.card.system')
                                                    : t('roles.card.custom')}
                                            </Badge>
                                        </td>

                                        <td className="px-6 py-4 max-w-xs">
                                            <span className="text-[rgb(var(--color-text-muted))] line-clamp-2" title={role.description}>
                                                {role.description || '-'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1 w-36">
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="font-semibold text-[rgb(var(--color-text))]">
                                                        {permCount} / {totalSystemPermissions}
                                                    </span>
                                                    <span className="text-[rgb(var(--color-text-muted))]">
                                                        {permPct}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full bg-[rgb(var(--color-bg-secondary))] overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full`}
                                                        style={{
                                                            backgroundColor: `rgba(${role.colorRGB})`,
                                                            width: `${Math.min(permPct, 100)}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {role.usersPreview && role.usersPreview.length > 0 ? (
                                                <div className="flex items-center">
                                                    {role.usersPreview.slice(0, 4).map((user, idx) => (
                                                        <UserAvatar
                                                            key={user.id}
                                                            avatarUrl={user.avatarUrl}
                                                            fullName={user.fullName}
                                                            className="w-7! h-7! border-2 border-[rgb(var(--color-bg))]"
                                                            style={{ marginLeft: idx === 0 ? '0px' : '-6px' }}
                                                        />
                                                    ))}
                                                    {role.usersPreview.length > 4 && (
                                                        <span className="text-[11px] font-semibold text-[rgb(var(--color-text-muted))] ml-1.5">
                                                            +{role.usersPreview.length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[rgb(var(--color-text-muted))]">--</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {role.slug !== 'administrator' ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate('permissions')}
                                                    className="text-xs font-semibold text-[rgb(var(--color-primary-500))] hover:bg-[rgb(var(--color-primary-500))]/10 rounded-lg px-3 py-1.5"
                                                    leftIcon={<span className="material-symbols-outlined text-sm">tune</span>}
                                                >
                                                    {t('roles.actions.editShort')}
                                                </Button>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {permissionsManagementTutorialIsOpen &&
                <div className="relative rounded-2xl border border-[rgb(var(--color-border))]/60 bg-linear-to-r from-[rgb(var(--color-primary-500))]/5 via-[rgb(var(--color-bg))] to-[rgb(var(--color-bg))] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Button
                        onClick={() => {
                            setPermissionsManagementTutorialIsOpen(false);
                            localStorage.setItem('permissionsManagementTutorialIsOpen', 'true')
                        }}
                        className="material-symbols-outlined absolute right-0 top-0 m-3 p-0! text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-500))] cursor-pointer text-(length:--fs-icon-sm)"
                        variant='unstyled'
                    >
                        close
                    </Button>
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[rgb(var(--color-primary-500))]/10 text-[rgb(var(--color-primary-500))] flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-xl">help</span>
                        </div>
                        <div>
                            <h4 className="mb-2 text-sm font-bold text-[rgb(var(--color-text))]">
                                {t('roles.banner.title')}
                            </h4>
                            <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
                                {t('roles.banner.description')}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('permissions')}
                        className="text-xs font-semibold rounded-md border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-bg))] shrink-0"
                        rightIcon={<span className="material-symbols-outlined text-sm">arrow_forward</span>}
                    >
                        {t('roles.banner.cta')}
                    </Button>
                </div>
            }
        </div>
    );
}