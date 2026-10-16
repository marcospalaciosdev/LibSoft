import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { firstCap } from '@/shared/utils/firstCap';
import {
  Button,
  Badge,
  Spinner,
  SearchBar,
  DropDownMenu,
  UserAvatar,
  PaginationFooter
} from '@/shared/components/ui';
import { usersApi } from '../api/users.api';

import type {
  RoleResponseDto,
  User,
  DataStatus
} from '@LibSoft/shared-types';

import { SectionHeader } from '@/shared/components/layout/SectionHeader';
import { ErrorState } from '@/shared/components/feedback';

import { usePermissions } from '@/hooks/usePermissions';
import { rolesApi } from '@/features/roles/api/roles.api';

export function UsersPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const { Permission } = usePermissions();

  const [tabStatus, setTabStatus] = useState<DataStatus>('loading');
  const [rolesStatus, setRolesStatus] = useState<DataStatus>('loading');

  const [usersList, setUsersList] = useState<User[]>([]);

  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);

  const [totalUsers, setTotalUsers] = useState<number>(0);

  const [roleOptions, setRoleOptions] = useState<RoleResponseDto[]>([]);

  const statusOptions = [
    { value: 'all', label: firstCap(t('common.all')) },
    { value: 'active', label: firstCap(t('common.statusValues.active')) },
    { value: 'inactive', label: firstCap(t('common.statusValues.inactive')) },
  ];

  const fetchRoles = useCallback(async () => {
    setRolesStatus('loading');
    try {
      const data = await rolesApi.getRoles({
        lang: i18n.language,
      });
      if (data) setRoleOptions(data);
      setRolesStatus('success');
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRolesStatus('error');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setTabStatus('loading');
      const response = await usersApi.getAll({
        limit,
        offset,
        search: debouncedSearch,
        role: roleFilter !== 'all' ? roleFilter : '',
        status: statusFilter !== 'all' ? statusFilter : '',
      });
      if (response) setUsersList(response);
      setTabStatus('success');
    } catch (error) {
      console.error('Error fetching users:', error);
      setTabStatus('error');
    }
  }, [limit, offset, debouncedSearch, roleFilter, statusFilter]);

  const fetchTotalUsers = useCallback(async () => {
    try {
      const data = await usersApi.getCount({
        search: debouncedSearch,
        role: roleFilter !== 'all' ? roleFilter : '',
        status: statusFilter !== 'all' ? statusFilter : '',
      });
      if (data !== undefined) setTotalUsers(Number(data));
    } catch (error) {
      console.error('Error fetching total users:', error);
    }
  }, [debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    console.log(roleOptions)
  }, [roleOptions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setOffset(0);
  }, [debouncedSearch, roleFilter, statusFilter, limit]);

  useEffect(() => {
    fetchUsers();
    fetchTotalUsers();
  }, [fetchUsers, fetchTotalUsers]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return (
    <>
      {tabStatus === 'loading' ? (
        <div className='flex justify-center items-center w-full h-full'>
          <Spinner size='lg' color='rgb(var(--color-primary-500))' />
        </div>
      ) : tabStatus === 'error' ? (
        <ErrorState
          title={firstCap(t('common.errorMessages.error'))}
          message={firstCap(t('users.errorLoadingUsers'))}
          retryLabel={firstCap(t('common.actions.retry'))}
          onRetry={() => {
            setTabStatus('loading');
            setRolesStatus('loading');
            fetchUsers();
            fetchTotalUsers();
            fetchRoles();
          }}
        />
      ) : tabStatus === 'success' ? (
        <div className="flex flex-col w-full h-full min-h-0 relative p-6 animate-[fadeIn_200ms_ease-out]">
          <SectionHeader
            title={firstCap(t('users.section'))}
            description={firstCap(t('users.description'))}
            icon='manage_accounts'
          >
            <Permission permissions={['users.create']}>
              <Button
                size="sm"
                className="flex flex-row items-center py-1.5 px-3 h-fit bg-[rgb(var(--color-primary-500))] rounded-sm hover:bg-[rgb(var(--color-primary-600))]"
                leftIcon={<span className="material-symbols-outlined text-(length:--fs-body)!">person_add</span>}
                onClick={() => navigate('/register')}
              >
                <span className="text-(length:--fs-caption)!">{firstCap(t('users.addUser'))}</span>
              </Button>
            </Permission>
          </SectionHeader>

          <div className="bg-[rgb(var(--color-bg))] rounded-xl border border-[rgb(var(--color-border))]/60 p-4 flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-stretch md:items-center">
              <div className="relative flex-1 w-100">
                <SearchBar
                  placeholder={firstCap(t('users.searchPlaceholder', { defaultValue: 'Buscar por nombre, correo o usuario...' }))}
                  onChange={(val) => setSearch(val)}
                  className="w-full h-8.75 rounded-md"
                />
              </div>
              <div className="flex items-center gap-2">
                <DropDownMenu
                  label={{
                    content: <span className="text-sm text-[rgb(var(--color-text-muted))]/75">{firstCap(t('common.role'))}:</span>,
                    position: 'left'
                  }}
                  className="bg-[rgb(var(--color-bg-secondary))]/40 text-[rgb(var(--color-text))] rounded-md text-xs border border-[rgb(var(--color-border))]/50 min-w-35 p-0!"
                  options={[
                    { value: 'all', label: firstCap(t('common.all')) },
                    ...roleOptions.map((role) => ({
                      value: String(role.id),
                      label: firstCap(role.name)
                    }))
                  ]}
                  onSelect={(val) => setRoleFilter(val)}
                  fontSize={"12.5px"}
                  height={'35px'}
                  isDisabled={rolesStatus === 'loading' || rolesStatus === 'error'}
                >
                  <span className="text-xs">
                    {rolesStatus === 'loading' ? (
                      <Spinner size="sm" />
                    ) : rolesStatus === 'error' ? (
                      <span className="text-danger text-xs">
                        --
                      </span>
                    ) : roleFilter !== 'all' ? (
                      firstCap(t(`common.roles.${roleOptions.find(opt => String(opt.id) === roleFilter)?.name}`))
                    ) : firstCap(t('common.all'))}
                  </span>
                </DropDownMenu>
              </div>

              <div className="flex items-center gap-2">
                <DropDownMenu
                  label={{
                    content: <span className="text-sm text-[rgb(var(--color-text-muted))]/75">{firstCap(t('common.status'))}:</span>,
                    position: 'left'
                  }}
                  className="bg-[rgb(var(--color-bg-secondary))]/40 text-[rgb(var(--color-text))] rounded-md text-xs border border-[rgb(var(--color-border))]/50 min-w-35 p-0!"
                  options={statusOptions}
                  onSelect={(val) => setStatusFilter(val)}
                  fontSize={"12.5px"}
                  height={'35px'}
                >
                  <span className="text-xs">
                    {statusOptions.find(opt => opt.value === statusFilter)?.label}
                  </span>
                </DropDownMenu>
              </div>
            </div>

            <div className="text-xs font-semibold text-[rgb(var(--color-text-muted))]/70 tracking-wide bg-[rgb(var(--color-bg-secondary))]/40 border border-[rgb(var(--color-border))]/40 px-3 rounded-lg flex items-center gap-2 justify-center h-9.25!">
              <span className="material-symbols-outlined text-sm text-[rgb(var(--color-primary-500))]">info</span>
              <span className="text-nowrap">{firstCap(t('common.results_count', { count: totalUsers }))}</span>
            </div>
          </div>

          <div className="bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))]/60 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="w-full overflow-x-auto flex-1">
              {usersList.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-24 h-full">
                  <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                    <span className="text-[rgb(var(--color-text))] material-symbols-outlined text-5xl">person_off</span>
                    <span className="text-[rgb(var(--color-text))] text-sm uppercase font-semibold">
                      {firstCap(t('users.noUsersFound', { defaultValue: 'No se encontraron usuarios' }))}
                    </span>
                  </div>
                </div>
              ) : (
                <table className="w-full min-w-250 border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[rgb(var(--color-bg))] border-b border-[rgb(var(--color-border))]">
                    <tr className="bg-[rgb(var(--color-bg-secondary))]">
                      <th className="py-4 px-6 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider">
                        {firstCap(t('users.tab.columns.fullName'))}
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider max-w-50">
                        {firstCap(t('users.tab.columns.username', { defaultValue: 'nombre de usuario' }))}
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider">
                        {firstCap(t('users.tab.columns.email'))}
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider">
                        {firstCap(t('users.tab.columns.role'))}
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider">
                        {firstCap(t('users.tab.columns.status'))}
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider">
                        {firstCap(t('users.tab.columns.phone'))}
                      </th>
                      <th className="py-4 px-6 text-right text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider">
                        {firstCap(t('users.tab.columns.actions'))}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgb(var(--color-border))]/50">
                    {usersList.map((user) => {
                      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

                      return (
                        <tr
                          key={user.id}
                          className="even:bg-[rgb(var(--color-tab-even))] hover:bg-[rgb(var(--color-bg-secondary))]/25 transition-all duration-150 group"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                className='w-8! h-8!'
                                avatarUrl={user.avatarUrl}
                                fullName={fullName}
                              />
                              <span className="font-semibold text-sm text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary-500))] transition-colors">
                                {fullName}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-sm text-[rgb(var(--color-text-muted))] max-w-50 overflow-hidden text-ellipsis whitespace-nowrap">
                            <span className="font-mono text-xs text-overflow-ellipsis">{user.username}</span>
                          </td>

                          <td className="py-4 px-6 text-sm text-[rgb(var(--color-text-muted))]">
                            {user.email}
                          </td>

                          <td className="py-4 px-6 text-sm">
                            <Badge
                              variant={
                                user.role.name === 'admin' ? 'info' :
                                  user.role.name === 'librarian' ? 'success' :
                                    'warning'
                              }
                              className="px-2.5 py-1 text-xs rounded-md font-semibold border"
                            >
                              {firstCap(t(`common.roles.${user.role.name}`, { defaultValue: user.role.name }))}
                            </Badge>
                          </td>

                          <td className="py-4 px-6 text-sm">
                            <Badge
                              variant={user.isActive ? 'success' : 'default'}
                              className="px-2.5 py-1 text-xs rounded-md font-semibold border"
                            >
                              {user.isActive
                                ? firstCap(t('common.statusValues.active'))
                                : firstCap(t('common.statusValues.inactive'))
                              }
                            </Badge>
                          </td>

                          <td className="py-4 px-6 text-sm font-mono text-[rgb(var(--color-text-soft))]">
                            {user.phoneNumber || '---'}
                          </td>

                          <td className="py-4 px-6 text-right align-middle">
                            <div className="flex items-center gap-2 justify-end">
                              <Permission permissions="users.update">
                                <Button
                                  className="aspect-square p-1.5! rounded-md text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-500))] hover:bg-[rgb(var(--color-primary-500))]/10 transition-all duration-200 flex items-center justify-center cursor-pointer border border-transparent hover:border-[rgb(var(--color-primary-500))]/20"
                                  variant="ghost"
                                  onClick={() => navigate(`edit/${user.id}`)}
                                  tooltip={{
                                    text: firstCap(t('common.actions.edit')),
                                    className: 'text-nowrap',
                                    fontSize: '10px'
                                  }}
                                >
                                  <span className="material-symbols-outlined text-md">edit</span>
                                </Button>
                              </Permission>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <PaginationFooter
              limitOptions={[10, 20, 25, 50]}
              limit={limit}
              offset={offset}
              totalItems={totalUsers}
              resultsCountText={firstCap(t('common.resultsCountText', { defaultValue: 'Resultados' }))}
              resultsPerPageLabel={
                <span className='text-[rgb(var(--color-text-muted))] text-(length:--fs-caption)'>
                  {firstCap(t('common.resultsPerPage'))}
                </span>
              }
              onLimitChange={(limit) => setLimit(limit)}
              onPageChange={(page) => setOffset(page)}
            />
          </div>
        </div >
      ) : (
        <span></span>
      )
      }
    </>
  );
}
