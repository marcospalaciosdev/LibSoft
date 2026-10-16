import { Input, DropDownMenu, Button } from "@/shared/components/ui";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

import { firstCap } from "@/shared/utils/firstCap";
import { useTranslation } from "react-i18next";

import { authApi, type RegisterRequest } from "../api/auth.api";
import { useEffect, useState } from "react";
import { APP_BRAND_GRADIENT_CLASSNAME } from "@/shared/constants";

import { USER_CONSTANTS } from '@LibSoft/shared-constants';

import type { RoleResponseDto, DataStatus } from "@LibSoft/shared-types";
import { LibsoftIsotype } from "@/shared/components/brand/LibsoftIsotype";
import { LibsoftLogotype } from "@/shared/components/brand/LibsoftLogotype";
import { rolesApi } from "@/features/roles/api/roles.api";

const INPUTS_CLASSNAME = 'rounded-md border-transparent bg-[rgb(var(--color-bg-tertiary))] text-[length:var(--fs-body-sm)]';
const INPUTS_LABEL_CLASSNAME = 'text-[rgb(var(--color-text))]/60 text-(length:--fs-caption)';

export const RegisterUserPage = () => {

  const { t, i18n } = useTranslation();

  const [errors, setErrors] = useState<any>([]);
  const [registerStatus, setRegisterStatus] = useState<DataStatus>('idle');
  const [roles, setRoles] = useState<RoleResponseDto[]>([]);

  const [emailIsAvailable, setEmailIsAvailable] = useState<boolean | null>(null);

  const [formData, setFormData] = useState<RegisterRequest>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    roleId: '',
    phoneNumber: '',
    password: '',
  });

  const fetchRoles = async () => {
    try {
      const response = await rolesApi.getRoles({
        users: false,
        usersLimit: 0,
        includeAdmin: true,
        lang: i18n.language,
      });
      console.log("Fetched roles:", response);
      setRoles(response);
    } catch (error: any) {

    }
  }

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleInputChange = (e: any, field?: string) => {

    if (field) {
      setFormData({
        ...formData,
        [field]: e
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  }

  const registerUser = async () => {
    try {
      setErrors([])
      setRegisterStatus('loading');

      await authApi.register(formData);
      setRegisterStatus('success');

      window.history.back();
    } catch (error: any) {

      setErrors(error.data.errors);
      setRegisterStatus('error');
    }
  }

  const checkMailAvailability = async () => {

    const email = formData.email;

    if (!email) return;

    try {
      const response = await authApi.checkEmailAvailability({ email });
      setEmailIsAvailable(response);
    } catch (error: any) {

    }
  }

  useEffect(() => { checkMailAvailability() }, [formData.email]);

  return (
    <div className="relative flex bg-[rgb(var(--color-bg-tertiary))] justify-center items-center w-full h-full overflow-hidden">
      <Button className="absolute top-6 left-6 aspect-square! material-symbols-outlined text-(length:--fs-icon-lg) cursor-pointer"
        onClick={() => window.history.back()}
        variant="ghost"
      >
        arrow_back
      </Button>
      <div className="bg-[rgb(var(--color-bg))] animate-fade-in rounded-2xl shadow-xl flex overflow-hidden">
        <div className={`w-75 flex-1 ${APP_BRAND_GRADIENT_CLASSNAME} py-10 px-10 flex flex-col justify-between`}>
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-10">
              <LibsoftLogotype
                sizeInPx={40}
              />
              <LibsoftIsotype
                fontSizeInPx={20}
                color='white'
                className="font-semibold"
              />
            </div>
            <span className="text-white text-2xl font-bold mt-2 mb-5">
              {firstCap(t('auth.register.title'))}
            </span>
            <span className="text-white text-(length:--fs-body-sm) w-full leading-relaxed">
              {firstCap(t('auth.register.description'))}
            </span>
          </div>
          <span className="text-white text-xs opacity-50 bottom-0">
            {firstCap(t('auth.register.footer'))}
          </span>
        </div>
        <div className="w-150 p-8 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-5">
            <Input
              onChange={(e) => handleInputChange(e)}
              name="firstName"
              error={errors.firstName && firstCap(t(`auth.register.inputs.firstName.errors.${errors.firstName}`, {
                count: ((type: string) => {
                  switch (type) {
                    case 'too_long': return USER_CONSTANTS.NAME.MAXIMUM_LENGTH;
                    default: return undefined;
                  }
                })(errors.firstName)
              }))}
              label={{
                content: <span className={INPUTS_LABEL_CLASSNAME}>{firstCap(t('auth.register.inputs.firstName.label'))}</span>,
              }}
              inputClassName={INPUTS_CLASSNAME}
              placeholder={firstCap(t('auth.register.inputs.firstName.placeholder'))}
              orientation="vertical"
            />
            <Input
              onChange={(e) => handleInputChange(e)}
              name="lastName"
              error={errors.lastName && firstCap(t(`auth.register.inputs.lastName.errors.${errors.lastName}`, {
                count: ((type: string) => {
                  switch (type) {
                    case 'too_long': return USER_CONSTANTS.NAME.MAXIMUM_LENGTH;
                    default: return undefined;
                  }
                })(errors.lastName)
              }))}
              label={{
                content: <span className={INPUTS_LABEL_CLASSNAME}>{firstCap(t('auth.register.inputs.lastName.label'))}</span>,
              }}
              inputClassName={INPUTS_CLASSNAME}
              placeholder={firstCap(t('auth.register.inputs.lastName.placeholder'))}
              orientation="vertical"
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <Input
              onChange={(e) => handleInputChange(e)}
              name="username"
              error={errors.username && firstCap(t(`auth.register.inputs.username.errors.${errors.username}`, {
                count: ((type: string) => {
                  switch (type) {
                    case 'too_short': return USER_CONSTANTS.USERNAME.MINIMUM_LENGTH;
                    case 'too_long': return USER_CONSTANTS.USERNAME.MAXIMUM_LENGTH;
                    default: return undefined;
                  }
                })(errors.username)
              }))}

              label={{
                content: <span className={INPUTS_LABEL_CLASSNAME}>{firstCap(t('auth.register.inputs.username.label'))}</span>,
              }}
              inputClassName={INPUTS_CLASSNAME}
              placeholder={firstCap(t('auth.register.inputs.username.placeholder'))}
              orientation="vertical"
            />
            <Input
              onChange={(e) => {
                handleInputChange(e)
                checkMailAvailability()
              }}
              name="email"
              error={emailIsAvailable ? (
                <span className="text-red-500">Email no disponible</span>
              ) : (
                errors.email && firstCap(t(`auth.register.inputs.email.errors.${errors.email}`)))
              }
              label={{
                content: <span className={INPUTS_LABEL_CLASSNAME}>{firstCap(t('auth.register.inputs.email.label'))}</span>,
              }}
              inputClassName={INPUTS_CLASSNAME}
              placeholder={t('auth.register.inputs.email.placeholder')}
              orientation="vertical"
            />
          </div>
          <div className="grid grid-cols-2 gap-5">

            {(() => {
              const selectedRole = roles.find((role) => String(role.id) === formData.roleId);
              return (
                <DropDownMenu
                  name="roleId"
                  error={errors.roleId && firstCap(t(`auth.register.inputs.role.errors.${errors.roleId}`))}
                  options={[
                    ...roles.map((role) => ({ label: firstCap(role.name), value: String(role.id) }))
                  ]}
                  onSelect={(value) => handleInputChange(value as string, "roleId")}
                  className={INPUTS_CLASSNAME}
                  fontSize="var(--fs-body-sm)"
                  color="rgb(var(--color-text))"
                  height="40px"
                  label={<span className={INPUTS_LABEL_CLASSNAME}>{firstCap(t('auth.register.inputs.role.label'))}</span>}
                  position="bottom"
                >
                  {firstCap(t(`${selectedRole !== undefined ? selectedRole?.name : 'auth.register.inputs.role.placeholder'}`))}
                </DropDownMenu>
              );
            })()}
            <div className="flex flex-col">
              <label htmlFor="phone_input" className={INPUTS_LABEL_CLASSNAME}>{firstCap(t('auth.register.inputs.phoneNumber.label'))}</label>
              <PhoneInput
                id='phone_input'
                placeholder={firstCap(t('borrowers.addBorrowerPage.inputs.phone.placeholder'))}
                name='phone'
                style={{ backgroundColor: 'rgb(var(--color-surface))' }}
                className={`${INPUTS_CLASSNAME} h-10 px-3 mt-2.5 mb-1.5 bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))]`}
                onChange={(value: string) => {
                  handleInputChange({ target: { name: 'phoneNumber', value: value } } as React.ChangeEvent<HTMLInputElement>);
                }}
                value={formData.phoneNumber}
              />
              {errors.phoneNumber && (
                <span className="text-red-500 text-(length:--fs-caption)">
                  {firstCap(t(`auth.register.inputs.phoneNumber.errors.${errors.phoneNumber}`))}
                </span>
              )}
            </div>
          </div>
          <div className="w-full">
            <Input
              onChange={(e) => handleInputChange(e)}
              name="password"
              inputType="password"
              error={errors.password && firstCap(t(`auth.register.inputs.password.errors.${errors.password}`))}
              label={{
                content: <span className={INPUTS_LABEL_CLASSNAME}>{firstCap(t('auth.register.inputs.password.label'))}</span>,
              }}
              inputClassName={INPUTS_CLASSNAME}
              placeholder={firstCap(t('auth.register.inputs.password.placeholder'))}
              orientation="vertical"
            />

            {!errors.password ? (
              <div className="flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-sm text-[rgb(var(--color-text))]/60">
                  info
                </span>
                <span className="text-(length:--fs-caption-sm) text-[rgb(var(--color-text))]/60">
                  {firstCap(t('auth.register.inputs.password.subtitle', { count: USER_CONSTANTS.PASSWORD.MINIMUM_LENGTH }))}
                </span>
              </div>
            ) : null
            }
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full rounded-md py-4"
            isLoading={registerStatus === 'loading'}
            rightIcon={<span className="material-symbols-outlined">arrow_forward</span>}
            onClick={registerUser}
          >
            <span className="text-white text-sm font-bold">
              {firstCap(t('auth.register.button.submit'))}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};