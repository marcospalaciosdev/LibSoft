import { useState, useEffect } from 'react';
import { useRef } from 'react';
import type { DataStatus } from '@LibSoft/shared-types';
import { SelectThemeButton } from '../components/SelectThemeButton.tsx';
import {
  Input,
  DropDownMenu,
  Button,
  UserAvatar,
  Spinner
} from '@/shared/components/ui';
import { useTranslation } from 'react-i18next';
import { firstCap } from '@/shared/utils/firstCap';

import { AVAILABLE_THEMES, DEFAULT_ACCENT_COLORS } from '@/shared/constants';
import { AccentManager, ThemeManager } from '@/config/useTheme.ts';

import { metadataApi } from '@/features/auth/metadata/metadata.api.ts';

import type {
  RoleResponseDto,
  LibraryProfileDto
} from '@LibSoft/shared-types';
import { SectionHeader } from '@/shared/components/layout/SectionHeader.tsx';
import { SelectAccentColorButton } from '../components/SelectAccentColorButton.tsx';
import { hexToRgbString } from '@/shared/utils/index.ts';
import { Permission } from '@/hooks/usePermissions.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import { useTimezone } from '@/context/TimezoneContext.tsx';

import { useNavigate } from 'react-router-dom';
import { rolesApi } from '@/features/roles/api/roles.api.ts';

const langOptions = [
  { value: 'en', label: 'English (US)' },
  { value: 'es', label: 'Español' },
];

const USERS_TAB_GRID = `grid-cols-[2fr_3fr_3fr]`;
const HEADER_TAB_COLUMNS_CLASSNAME = `py-3 text-[11px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider`;

export function SettingsPage() {
  const { t, i18n } = useTranslation();

  const { setTimezone } = useTimezone();
  const navigate = useNavigate();

  const [roles, setRoles] = useState<RoleResponseDto[]>([]);
  const [userHovered, setUserHovered] = useState<string>('');

  const [currentTheme, setCurrentTheme] = useState(ThemeManager.get());
  const [currentAccent, setCurrentAccent] = useState(AccentManager.get());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [saveButtonEnabled, setSaveButtonEnabled] = useState<boolean>(false);

  const { hasPermission } = useAuth();

  const [libraryProfileForm, setLibraryProfileForm] = useState<LibraryProfileDto>({
    libraryName: '',
    primaryEmail: '',
    phoneNumber: '',
    address: '',
  });

  const [libraryProfileStatus, setLibraryProfileStatus] = useState<DataStatus>('idle');
  const [libraryProfileFormSaveStatus, setLibraryProfileFormSaveStatus] = useState<DataStatus>('idle');

  const [rolesStatus, setRolesStatus] = useState<DataStatus>('idle');

  const [formErrors, setFormErrors] = useState<any>(null);

  const handleSaveLibraryProfile = async () => {

    if (hasPermission("library_profile.update") === false) return;

    try {
      setFormErrors(null);
      setLibraryProfileFormSaveStatus('loading');

      const payload = {
        libraryName: libraryProfileForm.libraryName || '',
        address: libraryProfileForm.address || '',
        primaryEmail: libraryProfileForm.primaryEmail || '',
        phoneNumber: libraryProfileForm.phoneNumber || '',
      }

      await metadataApi.updateLibaryProfile(payload);

      setLibraryProfileFormSaveStatus('success');
      setTimeout(() => setLibraryProfileFormSaveStatus('idle'), 4000);

      setSaveButtonEnabled(false);
    } catch (error: any) {
      console.error('Save failed:', error);
      setFormErrors(error.data?.errors || null);

      setLibraryProfileFormSaveStatus('error');
      setTimeout(() => setLibraryProfileFormSaveStatus('idle'), 4000);
    }
  };

  const handleInputChange = (
    field: keyof LibraryProfileDto,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const updatedLibraryProfileForm = {
      ...libraryProfileForm,
      [field]: e.target.value,
    };
    setLibraryProfileForm(updatedLibraryProfileForm);
    setSaveButtonEnabled(true);
  };

  const fetchLibraryProfile = async () => {
    try {
      setLibraryProfileStatus('loading');

      const data = await metadataApi.getLibraryProfile();
      setLibraryProfileForm({
        libraryName: data.libraryName,
        primaryEmail: data.primaryEmail,
        phoneNumber: data.phoneNumber,
        address: data.address,
      });
      setLibraryProfileStatus('success');
    } catch (error) {
      setLibraryProfileStatus('error');
    }
  }

  const fetchRoles = async () => {
    try {

      if (!hasPermission('roles.update')) return;

      setRolesStatus('loading');
      const data = await rolesApi.getRoles({
        lang: i18n.language,
        users: true,
        includeAdmin: true,
        usersLimit: 5,
      });

      setRoles(data);
      setRolesStatus('success');
    } catch {
      setRolesStatus('error');
    }
  };

  useEffect(() => {
    fetchLibraryProfile();
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [i18n.language]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="w-full mx-auto pb-12 p-6 animate-fade-in space-y-6">
      <SectionHeader
        title={firstCap(t('settings.title'))}
        description={firstCap(t('settings.description'))}
        icon='settings'
        className='p-0!'
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <Permission
          permissions='library_profile.read'
        >
          <div className="lg:col-span-8 bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))]/60 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            {libraryProfileStatus === 'loading' ? (
              <Spinner
                className='w-full h-full'
                color='rgb(var(--color-primary-500))'
              />
            ) : libraryProfileStatus === 'error' ? (
              <div className='flex flex-col gap-3 items-center justify-center w-full h-full'>
                <span className=' text-[rgb(var(--color-text-muted))] text-sm'>
                  {firstCap(t('settings.libraryProfile.errors.failedToLoad'))}
                </span>
                <Button
                  variant='primary'
                  onClick={fetchLibraryProfile}
                  className='text-(length:--fs-caption) px-3 py-1 rounded-md'
                >
                  {firstCap(t('common.actions.retry'))}
                </Button>
              </div>
            ) : libraryProfileStatus === 'success' ? (
              <>
                <div className="animate-fade-in flex items-center justify-between pb-6 border-b border-[rgb(var(--color-border))]/40">
                  <div>
                    <h2 className="text-base font-semibold text-[rgb(var(--color-text))] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] select-none text-xl">account_balance</span>
                      {firstCap(t('settings.libraryProfile.title'))}
                    </h2>
                    <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
                      {firstCap(t('settings.libraryProfile.subtitle'))}.
                    </p>
                  </div>
                  <Button
                    variant='primary'
                    size='sm'
                    className="text-xs px-4 py-2 font-medium rounded-lg shadow-sm transition-all duration-200"
                    isLoading={libraryProfileFormSaveStatus === 'loading'}
                    onClick={handleSaveLibraryProfile}
                    isDisabled={!saveButtonEnabled}
                  >
                    {firstCap(t('settings.libraryProfile.save'))}
                  </Button>
                </div>

                <div className="animate-fade-in flex flex-col sm:flex-row pt-6 gap-6 items-center sm:items-start">
                  <div className="h-36 w-36 shrink-0 bg-[rgb(var(--color-bg-secondary))] border border-[rgb(var(--color-border))]/50 flex items-center justify-center rounded-2xl shadow-inner group transition-colors">
                    <span className="material-symbols-outlined text-6xl text-[rgb(var(--color-primary-500))] group-hover:scale-105 transition-transform duration-300">menu_book</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
                    <Input
                      onChange={(e) => handleInputChange('libraryName', e)}
                      inputClassName="mb-1 text-sm rounded-xl bg-[rgb(var(--color-bg-secondary))] border-transparent focus:bg-[rgb(var(--color-bg))] transition-colors"
                      placeholder={firstCap(t('settings.libraryProfile.inputs.libraryName.placeholder'))}
                      label={{
                        content: <span className="text-xs font-semibold text-[rgb(var(--color-text))]">{firstCap(t('settings.libraryProfile.inputs.libraryName.label'))}</span>,
                      }}
                      value={libraryProfileForm?.libraryName || ''}
                      orientation="vertical"
                      error={formErrors?.libraryName ? firstCap(t(`settings.libraryProfile.inputs.libraryName.errors.${formErrors.libraryName}`)) : undefined}
                    />
                    <Input
                      onChange={(e) => handleInputChange('primaryEmail', e)}
                      inputClassName="mb-1 text-sm rounded-xl bg-[rgb(var(--color-bg-secondary))] border-transparent focus:bg-[rgb(var(--color-bg))] transition-colors"
                      placeholder={(t('settings.libraryProfile.inputs.primaryEmail.placeholder'))}
                      label={{
                        content: <span className="text-xs font-semibold text-[rgb(var(--color-text))]">{firstCap(t('settings.libraryProfile.inputs.primaryEmail.label'))}</span>,
                      }}
                      orientation="vertical"
                      value={libraryProfileForm?.primaryEmail || ''}
                      error={formErrors?.primaryEmail ? firstCap(t(`settings.libraryProfile.inputs.primaryEmail.errors.${formErrors.primaryEmail}`)) : undefined}
                    />
                    <Input
                      onChange={(e) => handleInputChange('phoneNumber', e)}
                      inputClassName="mb-1 text-sm rounded-xl bg-[rgb(var(--color-bg-secondary))] border-transparent focus:bg-[rgb(var(--color-bg))] transition-colors"
                      placeholder={firstCap(t('settings.libraryProfile.inputs.phoneNumber.placeholder'))}
                      label={{
                        content: <span className="text-xs font-semibold text-[rgb(var(--color-text))]">{firstCap(t('settings.libraryProfile.inputs.phoneNumber.label'))}</span>,
                      }}
                      orientation="vertical"
                      value={libraryProfileForm?.phoneNumber || ''}
                      error={formErrors?.phoneNumber ? firstCap(t(`settings.libraryProfile.inputs.phoneNumber.errors.${formErrors.phoneNumber}`)) : undefined}
                    />
                    <Input
                      onChange={(e) => handleInputChange('address', e)}
                      inputClassName="mb-1 text-sm rounded-xl bg-[rgb(var(--color-bg-secondary))] border-transparent focus:bg-[rgb(var(--color-bg))] transition-colors"
                      placeholder={firstCap(t('settings.libraryProfile.inputs.address.placeholder'))}
                      label={{
                        content: <span className="text-xs font-semibold text-[rgb(var(--color-text))]">{firstCap(t('settings.libraryProfile.inputs.address.label'))}</span>,
                      }}
                      orientation="vertical"
                      value={libraryProfileForm?.address || ''}
                      error={formErrors?.address ? firstCap(t(`settings.libraryProfile.inputs.address.errors.${formErrors.address}`)) : undefined}
                    />

                    {libraryProfileFormSaveStatus === 'success' && (
                      <div className="col-span-full flex items-center gap-2.5 px-4 py-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        <span className="text-xs font-medium">{firstCap(t('settings.libraryProfile.formSuccessMessage'))}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </Permission>

        <div className="lg:col-span-4 bg-[rgb(var(--color-bg))] rounded-2xl p-6 border border-[rgb(var(--color-border))]/60 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-[rgb(var(--color-text))] flex items-center gap-2 pb-6 border-b border-[rgb(var(--color-border))]/40">
              <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] select-none text-xl">tune</span>
              {firstCap(t('settings.preferences.title'))}
            </h2>

            <div className="space-y-5 pt-6">
              <div className="flex flex-col gap-1.5">
                <DropDownMenu
                  label={<span className="text-[11px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">{firstCap(t('settings.preferences.inputs.language'))}</span>}
                  options={langOptions}
                  onSelect={(value) => changeLanguage(value)}
                  className="w-full bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text))] rounded-xl text-sm border border-transparent hover:border-[rgb(var(--color-border))] focus:ring-2 focus:ring-[rgb(var(--color-primary-400))] outline-none font-medium transition-all"
                  fontSize={"14px"}
                  height={'42px'}
                >
                  {langOptions.find((opt) => opt.value === i18n.language)?.label || i18n.language}
                </DropDownMenu>
              </div>

              <div className="flex flex-col gap-1.5">
                <DropDownMenu
                  label={<span className="text-[11px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">{firstCap(t('settings.preferences.inputs.timeZone'))}</span>}
                  options={[
                    { value: 'America/Los_Angeles', label: 'Pacific Standard Time (PT)' },
                    { value: 'America/Argentina/Buenos_Aires', label: 'GMT-3 (Buenos Aires)' },
                    { value: 'UTC', label: 'UTC' }
                  ]}
                  onSelect={(value) => {
                    setTimezone(value);
                    window.location.reload(); // Reload to apply changes across all components
                  }}
                  className="w-full bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text))] rounded-xl text-sm border border-transparent hover:border-[rgb(var(--color-border))] focus:ring-2 focus:ring-[rgb(var(--color-primary-400))] outline-none font-medium transition-all"
                  fontSize={"14px"}
                  height={'42px'}
                >
                  {[
                    { value: 'America/Los_Angeles', label: 'Pacific Standard Time (PT)' },
                    { value: 'America/Argentina/Buenos_Aires', label: 'GMT-3 (Buenos Aires)' },
                    { value: 'UTC', label: 'UTC' }
                  ].find(opt => opt.value === (localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone))?.label || (localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone)}
                </DropDownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Permission
        permissions='roles.update'
      >
        <div className="bg-[rgb(var(--color-bg))] rounded-2xl p-6 border border-[rgb(var(--color-border))]/60 shadow-xs">
          {rolesStatus === 'loading' ? (
            <Spinner
              className='w-full h-full py-15'
              color='rgb(var(--color-primary-500))'
            />
          ) : rolesStatus === 'error' ? (
            <div className='flex flex-col gap-3 py-10 items-center justify-center w-full h-full'>
              <span className=' text-[rgb(var(--color-text-muted))] text-sm'>
                {firstCap(t('settings.security.errors.failedToLoad'))}
              </span>
              <Button
                variant='primary'
                onClick={fetchRoles}
                className='text-(length:--fs-caption) px-3 py-1 rounded-md'
              >
                {firstCap(t('common.actions.retry'))}
              </Button>
            </div>
          ) : rolesStatus === 'success' ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[rgb(var(--color-border))]/40">
                <div>
                  <h2 className="text-base font-semibold text-[rgb(var(--color-text))] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] text-xl select-none">shield_person</span>
                    <span className="capitalize">{t('settings.security.title')}</span>
                  </h2>
                  <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">{firstCap(t('settings.security.subtitle'))}.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<span className="material-symbols-outlined text-sm">edit</span>}
                  onClick={() => navigate('/settings/roles')}
                  className="text-xs px-4 py-2 font-medium rounded-md shadow-sm"
                >
                  Edit
                </Button>
              </div>

              <div className="w-full overflow-x-auto">
                <div className="min-w-150 w-full">
                  <ul className={`grid ${USERS_TAB_GRID} py-2.5 border-b border-[rgb(var(--color-border))]/40 uppercase`}>
                    <li className={HEADER_TAB_COLUMNS_CLASSNAME}><span>{firstCap(t('common.roles.role'))}</span></li>
                    <li className={HEADER_TAB_COLUMNS_CLASSNAME}><span>{firstCap(t('common.permissions'))}</span></li>
                    <li className={HEADER_TAB_COLUMNS_CLASSNAME}><span>{firstCap(t('common.users'))}</span></li>
                  </ul>

                  <div className="divide-y divide-[rgb(var(--color-border))]/30">
                    {roles.map((role, index) => (
                      <ul
                        key={role.id.toString()}
                        className={`grid ${USERS_TAB_GRID} min-h-14 py-2 items-center hover:bg-[rgb(var(--color-bg-secondary))]/40 transition-colors relative`}
                        style={{ zIndex: roles.length - index }}
                      >
                        <li className="flex items-center px-1">
                          <span className="text-[rgb(var(--color-text))] font-semibold text-sm">{firstCap(role.name)}</span>
                        </li>

                        <li className="min-w-0 pr-6">
                          <span className="block text-[rgb(var(--color-text-muted))] text-xs truncate" title={role.description}>
                            {role.description}
                          </span>
                        </li>

                        <li className="flex items-center pl-2">
                          {role.usersPreview && role.usersPreview.length > 0 ? (
                            <div className="flex items-center">
                              {role.usersPreview.map((user, uIdx) => (
                                <div
                                  key={user.id}
                                  className="relative group/avatar"
                                  style={{
                                    marginLeft: uIdx === 0 ? '0px' : '-10px',
                                    zIndex: userHovered === user.id ? 50 : uIdx + 1
                                  }}
                                >
                                  <UserAvatar
                                    onMouseEnter={() => setUserHovered(user.id)}
                                    onMouseLeave={() => setUserHovered('')}
                                    avatarUrl={user.avatarUrl}
                                    className="w-9! h-9! transition-transform duration-200 hover:scale-110 border-2 border-[rgb(var(--color-bg))] shadow-xs cursor-pointer"
                                    fullName={user.fullName}
                                  />

                                  {userHovered === user.id && (
                                    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 flex flex-col min-w-52.5 bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))] rounded-xl border border-[rgb(var(--color-border))] shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                                      <div className="flex gap-2.5 items-center">
                                        <UserAvatar
                                          avatarUrl={user.avatarUrl}
                                          fullName={user.fullName}
                                          className="w-8! h-8!"
                                        />
                                        <div className="flex flex-col min-w-0">
                                          <span className="font-semibold text-nowrap truncate text-xs">
                                            {firstCap(user.fullName)}
                                          </span>
                                          <span className="text-[11px] text-[rgb(var(--color-text-muted))] truncate">
                                            {user.username ? `@${user.username}` : 'Miembro del staff'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-[rgb(var(--color-text-muted))] font-medium">--</span>
                          )}
                        </li>
                      </ul>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </Permission>

      <div className="bg-[rgb(var(--color-bg))] rounded-2xl p-6 border border-[rgb(var(--color-border))]/60 shadow-xs">
        <div className='mb-6'>
          <h2 className="text-base font-semibold text-[rgb(var(--color-text))] flex items-center gap-2">
            <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] select-none text-xl">palette</span>
            {firstCap(t('settings.appearance.title')) || 'Apariencia'}
          </h2>
          <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
            {firstCap(t('settings.appearance.subtitle')) || 'Personalizá el aspecto visual y la interfaz del sistema'}.
          </p>
        </div>

        <div className='w-full border-t border-[rgb(var(--color-border))] flex flex-col py-4'>
          <div className='flex flex-row items-center gap-2'>
            <span className='material-symbols-outlined text-[rgb(var(--color-primary-500))] text-[length:--fs-body]'>format_color_fill</span>
            <span className='font-semibold text-[rgb(var(--color-text))] text-sm'>
              {firstCap(t('settings.appearance.theme.title'))}
            </span>
          </div>
          <div className="flex flex-row overflow-x-auto gap-2 w-full py-4">
            <div
              onClick={() => {
                ThemeManager.set('system');
                setCurrentTheme('system');
              }}
              style={{
                border: '1px solid',
                borderColor: currentTheme === 'system' ? 'rgb(var(--color-primary-500))' : 'var(--p-border)',
                boxShadow: currentTheme === 'system' ? '0 8px 20px -4px rgba(var(--color-primary-500), 0.1)' : 'none',
                transform: currentTheme === 'system' ? 'translateY(-2px)' : 'none'
              }}
              className='min-w-80 relative rounded-2xl transition-all duration-200 shadow-md overflow-hidden cursor-pointer'
            >
              <div className='w-full overflow-hidden'>
                <SelectThemeButton
                  className='min-w-80 border-none!'
                  key={`theme-dark`}
                  isSelected={currentTheme === 'system'}
                  theme={{
                    id: '',
                    previewClass: 'theme-preview-dark'
                  }}
                />
              </div>

              {/* Lado Claro (Superpuesto con difuminado) */}
              <div
                className='w-3/4 overflow-hidden absolute top-0 left-0 z-10 pointer-events-none'
                style={{
                  WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
                  maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)'
                }}
              >
                <SelectThemeButton
                  className='min-w-80 border-none!'
                  key={`theme-light`}
                  isSelected={currentTheme === 'system'}
                  theme={{
                    id: 'system',
                    previewClass: 'theme-preview-light'
                  }}
                />
              </div>
            </div>
            {AVAILABLE_THEMES.map((theme) => {
              const isSelected = theme.id === currentTheme;
              return (
                <SelectThemeButton
                  className='min-w-80 border'
                  key={`theme-${theme.id}`}
                  theme={theme}
                  isSelected={isSelected}
                  style={{
                    borderColor: isSelected ? 'var(--p-accent)' : 'var(--p-border)',
                    boxShadow: isSelected ? '0 8px 20px -4px rgba(var(--color-primary-500), 0.2)' : 'none',
                    transform: isSelected ? 'translateY(-2px)' : 'none'
                  }}
                  onSelect={(theme) => {
                    ThemeManager.set(theme);
                    setCurrentTheme(theme);
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className='w-full border-t border-[rgb(var(--color-border))] flex flex-col gap-4 pt-4'>
          <div className='flex flex-row items-center gap-2'>
            <span className='material-symbols-outlined text-[rgb(var(--color-primary-500))] text-[length:--fs-body]'>palette</span>
            <span className='font-semibold text-[rgb(var(--color-text))] text-sm'>
              {firstCap(t('settings.appearance.accent.title'))}
            </span>
          </div>
          <div className="flex flex-row gap-2 w-full py-2 overflow-y-visible px-2">
            {DEFAULT_ACCENT_COLORS.map((color) => {
              return (
                <SelectAccentColorButton
                  key={`accent-${color}`}
                  color={color}
                  isCurrent={color === currentAccent}
                  setAccent={(newColor) => {
                    setCurrentAccent(newColor);
                    AccentManager.set(newColor);
                  }}
                />
              );
            })}
            <Button
              className='relative w-12 h-12 bg-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white shadow-[0_4px_12px_rgba(255,0,0,0.1),_4px_4px_12px_rgba(255,165,0,0.1),_4px_0_12px_rgba(255,255,0,0.1),_0_-4px_12px_rgba(0,128,0,0.1),_-4px_-4px_12px_rgba(50,120,255,0.1),_-4px_0_12px_rgba(128,0,128,0.1)]'
            >
              <span className='material-symbols-outlined text-xl text-gray-700 pointer-events-none z-10'>
                edit
              </span>
              <input
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const hexColor = e.target.value;
                  setCurrentAccent(hexColor);
                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                  timeoutRef.current = setTimeout(() => {
                    const rgbColor = `rgb(${hexToRgbString(hexColor)})`;
                    AccentManager.set(rgbColor);
                  }, 500);
                }}

                value={currentAccent}
                type="color"
                className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 rounded-full'
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}