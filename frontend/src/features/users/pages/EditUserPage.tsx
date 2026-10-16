import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { APP_BRAND_GRADIENT_CLASSNAME } from '@/shared/constants';

import { Permission } from '@/hooks/usePermissions';

import { getInitials, formatDate } from '@/shared/utils';
import { firstCap } from "@/shared/utils/firstCap";
import { useTranslation } from "react-i18next";
import {
  Input,
  Badge,
  SelectMenu,
  DropDownMenu,
  Button,
  Spinner
} from "@/shared/components/ui";

import type { User, RoleResponseDto, DataStatus } from '@LibSoft/shared-types';
import { usersApi } from '../api/users.api';
import { SectionHeader } from '@/shared/components/layout/SectionHeader';
import { rolesApi } from '@/features/roles/api/roles.api';

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
];

const statusOptions_className = "bg-[rgb(var(--color-bg-secondary))] hover:bg-[rgb(var(--color-bg-tertiary))] rounded-lg border border-[rgb(var(--color-border))]/40 transition-colors";

export function EditUserPage() {
  const { t } = useTranslation();
  const { id } = useParams();

  const navigate = useNavigate();

  const [roles, setRoles] = useState<RoleResponseDto[]>([]);
  const [roleLabel, setRoleLabel] = useState<string>('');
  const [userData, setUserData] = useState<User | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [userDataStatus, setUserDataStatus] = useState<DataStatus | 'saving'>('loading');
  const [saveDataStatus, setSaveDataStatus] = useState<DataStatus>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    setUserData({
      ...userData,
      [key]: e.target.value
    } as User);
  };

  useEffect(() => { console.log(userData) }, [userData]);

  const getUser = async () => {
    try {
      setUserDataStatus('loading');
      const user = await usersApi.getById(id as string);
      console.log(" --- GET USER RESPONSE ---");
      console.log(user);
      setRoleLabel(user?.role?.name ?? '');
      setUserData(user);
      setUserDataStatus('success');
    } catch (error) {
      console.log(error);
      setUserDataStatus('error');
    }
  };

  const handleSave = async () => {
    try {
      setSaveDataStatus('loading');
      setErrors({});
      const payload = {
        ...userData,
        roleId: userData?.role?.id,
      } as User & { roleId?: string };

      const updatedUser = await usersApi.update(id as string, payload);
      setUserData(updatedUser);

      setSaveDataStatus('success');
    } catch (error: any) {
      setErrors(error?.data?.errors ?? {});
      setSaveDataStatus('error');
    }
  }

  const fetchRoles = async () => {
    const roles = await rolesApi.getRoles({
      includeAdmin: false,
      users: false,
      includePermissions: false,
    });
    setRoles(roles);
  };

  useEffect(() => {
    getUser();
    fetchRoles();
  }, [id]);

  return (
    <>
      {userDataStatus === 'loading' ? (
        <div className='flex w-full h-full justify-center items-center'>
          <Spinner
            size='md'
            color='rgb(var(--color-primary-500))'
          />
        </div>
      ) : userDataStatus === 'error' ? (
        <div className='flex flex-col w-full h-full justify-center items-center gap-4'>
          <span>

          </span>
          <span className="text-lg text-[rgb(var(--color-text))]">
            {firstCap(t('editUser.loading.error'))}
          </span>
          <Button
            size='md'
            color='rgb(var(--color-primary-500))'
          >
            {firstCap(t('common.actions.retry'))}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col w-full min-h-0 relative p-6 animate-fade-in">
          <SectionHeader
            title={firstCap(t('editUser.section'))}
            description={firstCap(t('editUser.subtitle'))}
            icon="person"
          />

          <div className="w-full flex flex-col">
            <header className="bg-[rgb(var(--color-bg))] rounded-2xl  border border-[rgb(var(--color-border))]/40 overflow-hidden transition-all">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="">
                    {userData?.avatarUrl ? (
                      <div className="relative group flex w-16 h-16 shrink-0 justify-center items-center overflow-hidden rounded-2xl border border-[rgb(var(--color-border))]/40 shadow-inner bg-[rgb(var(--color-bg-secondary))]">
                        <div className="w-full h-full relative">
                          <img
                            src={userData.avatarUrl}
                            alt="User Avatar"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`${APP_BRAND_GRADIENT_CLASSNAME} w-16 h-16 rounded-full text-white flex items-center justify-center text-xl font-bold shadow-md ring-4 ring-[rgb(var(--color-primary-500))]/10 shrink-0`}>
                        {getInitials(`${userData?.firstName?.replace(/\s/g, '') || ''} ${userData?.lastName?.replace(/\s/g, '') || ''}`) || '--'}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-[rgb(var(--color-text))] tracking-tight">
                        {userData?.firstName || userData?.lastName
                          ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
                          : t('editUser.loadingUser', 'Cargando Usuario...')}
                      </h2>
                      {userData?.role?.name && (
                        <Badge variant="info" className="px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-[rgb(var(--color-primary-500))]/10 text-[rgb(var(--color-primary-500))] border border-[rgb(var(--color-primary-500))]/20">
                          {firstCap(userData.role.name)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[rgb(var(--color-text-muted))]">
                      {userData?.dni && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">badge</span>
                          DNI: {userData.dni}
                        </span>
                      )}
                      {userData?.email && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">mail</span>
                          {userData.email}
                        </span>
                      )}
                      {userData?.phoneNumber && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">call</span>
                          {userData.phoneNumber}
                        </span>
                      )}
                      {userData?.createdAt && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">calendar_today</span>
                          {formatDate(userData.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </header >
            <div className='flex flex-col gap-6 mt-6'>
              <div className='flex flex-row gap-6'>
                <div className='bg-[rgb(var(--color-bg))] p-6 rounded-2xl  border border-[rgb(var(--color-border))]/40 flex flex-col gap-5 flex-1'>
                  <div className='flex flex-row gap-3 items-center pb-3 border-b border-[rgb(var(--color-border))]/30'>
                    <span className='material-symbols-outlined text-[rgb(var(--color-primary-500))] text-xl'>
                      manage_accounts
                    </span>
                    <span className='text-[rgb(var(--color-text))] font-bold text-xs uppercase tracking-wider'>
                      {firstCap(t('editUser.accountSettings.section'))}
                    </span>
                  </div>
                  <div className='flex flex-col gap-4.5'>
                    <Input
                      error={errors?.username && firstCap(t(`editUser.accountSettings.inputs.username.error.${errors.username}`))}
                      onChange={(e) => handleInputChange(e, 'username')}
                      value={userData?.username}
                      label={firstCap(t('editUser.accountSettings.inputs.username.label'))}
                      placeholder={firstCap(t('editUser.accountSettings.inputs.username.placeholder'))}
                      inputClassName='rounded-md! h-11 text-sm bg-[rgb(var(--color-bg-secondary))] border-[rgb(var(--color-border))]/40 rounded-xl focus:border-[rgb(var(--color-primary-500))] transition-all'
                    />
                    <DropDownMenu
                      label={
                        <span className='cursor-pointer text-sm font-medium text-[rgb(var(--color-text-muted))] whitespace-nowrap overflow-hidden text-ellipsis min-w-0'>
                          {firstCap(t('editUser.accountSettings.inputs.role.label'))}
                        </span>
                      }
                      error={errors?.roleId && firstCap(t(`editUser.accountSettings.inputs.role.error.${errors.roleId}`))}
                      options={roles.map((role) => ({
                        label: firstCap(role.name),
                        value: String(role.id),
                      }))}
                      onSelect={(value, label) => {
                        setRoleLabel(label);
                        setUserData({
                          ...userData,
                          role: { id: Number(value) }
                        } as User);
                      }}
                      mainClassName='gap-[1px]'
                      className='bg-[rgb(var(--color-bg-secondary))] border-[rgb(var(--color-border))]/40 hover:border-[rgb(var(--color-border))] rounded-xl text-[rgb(var(--color-text))]'
                      fontSize='14px'
                      height='44px'
                    >
                      {firstCap(roleLabel)}
                    </DropDownMenu>
                  </div>
                </div>
                <div className='bg-[rgb(var(--color-bg))] p-6 rounded-2xl  border border-[rgb(var(--color-border))]/40 flex flex-col gap-5 flex-1'>
                  <div className='flex flex-row gap-3 items-center pb-3 border-b border-[rgb(var(--color-border))]/30'>
                    <span className='material-symbols-outlined text-[rgb(var(--color-primary-500))] text-xl'>contact_page</span>
                    <span className='text-[rgb(var(--color-text))] font-bold text-xs uppercase tracking-wider'>{firstCap(t('editUser.contactInfo.section'))}</span>
                  </div>

                  <div className='flex flex-col gap-5'>
                    <Input
                      error={errors?.email && firstCap(t(`editUser.contactInfo.inputs.email.error.${errors.email}`))}
                      onChange={(e) => handleInputChange(e, 'email')}
                      inputClassName='rounded-md! h-11 text-sm bg-[rgb(var(--color-bg-secondary))] border-[rgb(var(--color-border))]/40 rounded-xl'
                      label={{
                        content: <span>{firstCap(t('editUser.contactInfo.inputs.email.label'))}</span>,
                        height: 'auto',
                        width: '100%'
                      }}
                      value={userData?.email}
                      placeholder={firstCap(t('editUser.contactInfo.inputs.email.placeholder'))}
                    />

                    <Input
                      error={errors?.phoneNumber && firstCap(t(`editUser.contactInfo.inputs.phone.error.${errors.phoneNumber}`))}
                      onChange={(e) => handleInputChange(e, 'phoneNumber')}
                      inputClassName='rounded-md! h-11 text-sm bg-[rgb(var(--color-bg-secondary))] border-[rgb(var(--color-border))]/40 rounded-xl'
                      label={{
                        content: <span>{firstCap(t('editUser.contactInfo.inputs.phone.label'))}</span>,
                        height: 'auto',
                        width: '100%'
                      }}
                      value={userData?.phoneNumber}
                      placeholder={firstCap(t('editUser.contactInfo.inputs.phone.placeholder'))}
                    />
                  </div>
                </div>
                <Permission
                  permissions='users.update_status'
                >
                  <div className='flex flex-col justify-between bg-[rgb(var(--color-bg))] p-6 rounded-2xl  border border-[rgb(var(--color-border))]/40 gap-4 flex-1'>
                    <div className='flex flex-row gap-3 items-center pb-3 border-b border-[rgb(var(--color-border))]/30'>
                      <span className='material-symbols-outlined text-[rgb(var(--color-primary-500))] text-xl'>manage_accounts</span>
                      <span className='text-[rgb(var(--color-text))] font-bold text-xs uppercase tracking-wider'>{firstCap(t('editUser.accountStatus.section'))}</span>
                    </div>

                    <div className='relative h-full pt-1'>
                      <SelectMenu
                        options={statusOptions.map((option) => ({
                          label: firstCap(t(`common.statusValues.${option.value}`)),
                          value: option.value,
                          className: statusOptions_className
                        }))}
                        className='w-full'
                        onSelect={(option) => console.log(option)}
                        notNullable
                      />
                    </div>

                    <div className='flex items-start gap-3 p-3.5 rounded-xl bg-[rgb(var(--color-primary-500))]/5 border border-[rgb(var(--color-primary-500))]/15 mt-2'>
                      <span className='material-symbols-outlined text-[rgb(var(--color-primary-500))] mt-0.5 text-lg shrink-0'>info</span>
                      <span className='text-[rgb(var(--color-primary-500))] text-xs font-medium leading-relaxed'>
                        {firstCap(t('editUser.accountStatus.warning'))}
                      </span>
                    </div>
                  </div>
                </Permission>
              </div>

              <div className='bg-[rgb(var(--color-bg))] p-6 rounded-2xl  border border-[rgb(var(--color-border))]/40 flex flex-col gap-5'>
                <div className='flex flex-row gap-3 items-center pb-3 border-b border-[rgb(var(--color-border))]/30'>
                  <span className='material-symbols-outlined text-[rgb(var(--color-primary-500))] text-xl'>card_membership</span>
                  <span className='text-[rgb(var(--color-text))] font-bold text-xs uppercase tracking-wider'>{firstCap(t('editUser.personalInfo.section'))}</span>
                </div>

                <div className='grid grid-cols-2 gap-5'>
                  <Input
                    error={errors?.firstName && firstCap(t(`editUser.personalInfo.inputs.firstName.error.${errors.firstName}`))}
                    onChange={(e) => handleInputChange(e, 'firstName')}
                    inputClassName='rounded-md! h-11 text-sm bg-[rgb(var(--color-bg-secondary))] border-[rgb(var(--color-border))]/40 rounded-xl'
                    label={{
                      content: <span>{firstCap(t('editUser.personalInfo.inputs.firstName.label'))}</span>,
                      width: '100%',
                      height: 'auto',
                    }}
                    placeholder={firstCap(t('editUser.personalInfo.inputs.firstName.placeholder'))}
                    value={userData?.firstName}
                  />

                  <Input
                    error={errors?.lastName && firstCap(t(`editUser.personalInfo.inputs.lastName.error.${errors.lastName}`))}
                    onChange={(e) => handleInputChange(e, 'lastName')}
                    inputClassName='rounded-md! h-11 text-sm bg-[rgb(var(--color-bg-secondary))] border-[rgb(var(--color-border))]/40 rounded-xl'
                    label={{
                      content: <span>{firstCap(t('editUser.personalInfo.inputs.lastName.label'))}</span>,
                      width: '100%',
                      height: 'auto',
                    }}
                    placeholder={firstCap(t('editUser.personalInfo.inputs.lastName.placeholder'))}
                    value={userData?.lastName}
                  />

                  <Input
                    error={errors?.dni && firstCap(t(`editUser.personalInfo.inputs.dni.error.${errors.dni}`))}
                    inputClassName='rounded-md! h-11 text-sm bg-[rgb(var(--color-bg-secondary))]/60 border-[rgb(var(--color-border))]/30 rounded-xl opacity-75 cursor-not-allowed'
                    label={{
                      content: <span>{firstCap(t('editUser.personalInfo.inputs.dni.label'))}</span>,
                      width: '100%',
                      height: 'auto',
                    }}
                    value={userData?.dni || '--'}
                    disabled
                  />

                  <Input
                    error={errors?.address && firstCap(t(`editUser.personalInfo.inputs.address.error.${errors.address}`))}
                    onChange={(e) => handleInputChange(e, 'address')}
                    inputClassName='rounded-md! h-11 text-sm bg-[rgb(var(--color-bg-secondary))] border-[rgb(var(--color-border))]/40 rounded-xl'
                    label={{
                      content: <span>{firstCap(t('editUser.personalInfo.inputs.address.label'))}</span>,
                      height: 'auto',
                      width: '100%'
                    }}
                    value={userData?.address}
                    placeholder={firstCap(t('editUser.personalInfo.inputs.address.placeholder'))}
                  />
                </div>
              </div>
            </div>
            <div className='w-full flex justify-end gap-3 mt-6'>
              <Button
                variant='ghost'
                className='rounded-md'
                disabled={saveDataStatus === "loading"}
                onClick={() => navigate("/users")}
              >
                {firstCap(t('editUser.cancel'))}
              </Button>
              <Button
                onClick={() => handleSave()}
                variant='primary'
                className='rounded-md'
                isLoading={saveDataStatus === 'loading'}
              >
                {firstCap(t('editUser.saveChanges'))}
              </Button>
            </div>
          </div >
        </div>
      )}
    </>
  );
}