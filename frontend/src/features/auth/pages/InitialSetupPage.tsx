import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, DropDownMenu } from '@/shared/components/ui';
import { APP_NAME, DEFAULT_FRONTEND_ROUTE } from '@/shared/constants';
import { USER_CONSTANTS } from '@LibSoft/shared-constants';
import { firstCap } from '@/shared/utils/firstCap';
import { authApi, type SetupAdminRequest } from '../api/auth.api';
import { useAuth } from '@/hooks/useAuth';
import { LibsoftLogotype } from '@/shared/components/brand/LibsoftLogotype';
import PhoneInput from 'react-phone-number-input';

import { APP_BRAND_GRADIENT_CLASSNAME } from '@/shared/constants';
import type { DataStatus } from '@LibSoft/shared-types';

type SetupFormState = SetupAdminRequest & {
    confirmPassword: string;
};

type SetupErrors = Partial<Record<keyof SetupFormState, string>> & {
    form?: string;
};

const INPUT_CLASSNAME = 'rounded-md border-transparent bg-[rgb(var(--color-bg-tertiary))] text-[length:var(--fs-body-sm)]';

interface InitialSetupPageProps {
    onSetupComplete?: () => void | Promise<void>;
}

export function InitialSetupPage({ onSetupComplete }: InitialSetupPageProps) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { login } = useAuth();

    const [formData, setFormData] = useState<SetupFormState>({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<SetupErrors>({});
    const [submitStatus, setSubmitStatus] = useState<DataStatus>('idle');

    const passwordMinLength = USER_CONSTANTS.PASSWORD.MINIMUM_LENGTH;

    const getFieldErrorMessage = (field: keyof SetupFormState, code: string) => {
        const maxNameLength = USER_CONSTANTS.NAME.MAXIMUM_LENGTH;
        const maxUsernameLength = USER_CONSTANTS.USERNAME.MAXIMUM_LENGTH;
        const minUsernameLength = USER_CONSTANTS.USERNAME.MINIMUM_LENGTH;

        const genericMessages: Record<string, string> = {
            required: firstCap(t('common.validation.required', { defaultValue: 'Este campo es obligatorio.' })),
            invalid_format: firstCap(t('common.validation.invalidFormat', { defaultValue: 'El formato ingresado no es válido.' })),
            missing_uppercase: firstCap(t('common.validation.passwordUppercase', { defaultValue: 'La contraseña debe incluir una letra mayúscula.' })),
            missing_number: firstCap(t('common.validation.passwordNumber', { defaultValue: 'La contraseña debe incluir un número.' })),
            missing_special_char: firstCap(t('common.validation.passwordSpecial', { defaultValue: 'La contraseña debe incluir un símbolo.' })),
            invalid_characters: firstCap(t('common.validation.invalidCharacters', { defaultValue: 'El valor contiene caracteres no permitidos.' })),
            only_letters: firstCap(t('common.validation.onlyLetters', { defaultValue: 'Solo se permiten letras.' })),
        };

        if (code in genericMessages) {
            return genericMessages[code];
        }

        if (field === 'firstName' || field === 'lastName') {
            if (code === 'too_long') {
                return firstCap(t('common.validation.maxLength', {
                    defaultValue: 'No puede superar {{count}} caracteres.',
                    count: maxNameLength,
                }));
            }
        }

        if (field === 'username') {
            if (code === 'too_short') {
                return firstCap(t('common.validation.minLength', {
                    defaultValue: 'Debe tener al menos {{count}} caracteres.',
                    count: minUsernameLength,
                }));
            }

            if (code === 'too_long') {
                return firstCap(t('common.validation.maxLength', {
                    defaultValue: 'No puede superar {{count}} caracteres.',
                    count: maxUsernameLength,
                }));
            }
        }

        if (field === 'phoneNumber') {
            if (code === 'too_short') {
                return firstCap(t('common.validation.phoneMin', { defaultValue: 'El teléfono es demasiado corto.' }));
            }

            if (code === 'too_long') {
                return firstCap(t('common.validation.phoneMax', { defaultValue: 'El teléfono es demasiado largo.' }));
            }
        }

        if (field === 'password' && code === 'too_long') {
            return firstCap(t('common.validation.passwordMax', { defaultValue: 'La contraseña es demasiado larga.' }));
        }

        return code;
    };

    const helperText = useMemo(
        () => firstCap(t('auth.setup.helper', { defaultValue: 'Este paso solo aparece la primera vez para crear el administrador principal.' })),
        [t],
    );

    const setFieldValue = (field: keyof SetupFormState, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
    };

    const validateBeforeSubmit = () => {
        const nextErrors: SetupErrors = {};

        if (formData.password !== formData.confirmPassword) {
            nextErrors.confirmPassword = firstCap(t('auth.setup.errors.passwordMismatch', { defaultValue: 'Las contraseñas no coinciden.' }));
        }

        if (formData.password.length < passwordMinLength) {
            nextErrors.password = firstCap(t('auth.setup.errors.passwordTooShort', {
                defaultValue: 'La contraseña debe tener al menos {{count}} caracteres.',
                count: passwordMinLength,
            }));
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateBeforeSubmit()) {
            return;
        }

        setSubmitStatus('loading');

        try {
            const payload: SetupAdminRequest = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                password: formData.password,
            };

            await authApi.setupAdmin(payload);
            await onSetupComplete?.();
            await login({
                identifier: payload.email,
                password: payload.password,
            });

            setSubmitStatus('success');
            navigate(DEFAULT_FRONTEND_ROUTE, { replace: true });
        } catch (error: any) {
            const apiErrors = error?.data?.errors;

            if (apiErrors && typeof apiErrors === 'object') {
                const nextErrors: SetupErrors = {};

                (Object.entries(apiErrors) as Array<[keyof SetupFormState, string]>).forEach(([field, code]) => {
                    nextErrors[field] = getFieldErrorMessage(field, code);
                });

                setErrors(nextErrors);
                setSubmitStatus('error');
                return;
            }

            setErrors({
                form: error?.data?.message || firstCap(t('auth.setup.errors.generic', { defaultValue: 'No se pudo completar la configuración inicial.' })),
            });

            if (error?.status === 409) {
                setSubmitStatus('success');
                await onSetupComplete?.();
                navigate('/login', { replace: true });
                return;
            }

            setSubmitStatus('error');
        }
    };

    return (
        <div className="relative flex h-full items-center justify-center overflow-y-auto bg-[rgb(var(--color-bg-tertiary))] px-4 py-8">
            <div className="w-full max-w-5xl animate-fade-in overflow-hidden rounded-2xl bg-[rgb(var(--color-bg))] shadow-xl">
                <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
                    <section className={`${APP_BRAND_GRADIENT_CLASSNAME} px-8 py-10 text-white sm:px-10 lg:px-12`}>
                        <div className="mb-10 flex items-center gap-3">
                            <LibsoftLogotype sizeInPx={45} />
                            <span className="text-xl font-bold">{APP_NAME}</span>
                        </div>

                        <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                            {firstCap(t('auth.setup.badge', { defaultValue: 'Configuración inicial' }))}
                        </span>

                        <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">
                            {firstCap(t('auth.setup.title', { defaultValue: 'Crea el administrador principal de la biblioteca' }))}
                        </h1>

                        <p className="mt-4 text-sm leading-relaxed text-white/85 sm:text-base">
                            {firstCap(t('auth.setup.description', {
                                defaultValue: 'Antes de usar el sistema necesitas registrar la cuenta administradora que gestionará usuarios, permisos y la configuración global.',
                            }))}
                        </p>

                        <div className="mt-8 rounded-2xl border border-white/15 bg-black/10 p-5">
                            <p className="text-sm font-semibold">{helperText}</p>
                            <ul className="mt-4 space-y-3 text-sm text-white/80">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-base">verified_user</span>
                                    <span>{firstCap(t('auth.setup.benefits.admin', { defaultValue: 'El usuario creado tendrá el rol administrador.' }))}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-base">dataset</span>
                                    <span>{firstCap(t('auth.setup.benefits.catalogs', { defaultValue: 'Los catálogos base y permisos del sistema ya estarán cargados automáticamente.' }))}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-base">lock</span>
                                    <span>{firstCap(t('auth.setup.benefits.security', { defaultValue: 'Este formulario dejará de mostrarse una vez creada la cuenta inicial.' }))}</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section className="p-8 sm:p-10 lg:p-12">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Input
                                name="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFieldValue('firstName', e.target.value)}
                                label={{ content: firstCap(t('auth.register.inputs.firstName.label')) }}
                                placeholder={firstCap(t('auth.register.inputs.firstName.placeholder'))}
                                inputClassName={INPUT_CLASSNAME}
                                error={errors.firstName}
                                orientation="vertical"
                            />
                            <Input
                                name="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFieldValue('lastName', e.target.value)}
                                label={{ content: firstCap(t('auth.register.inputs.lastName.label')) }}
                                placeholder={firstCap(t('auth.register.inputs.lastName.placeholder'))}
                                inputClassName={INPUT_CLASSNAME}
                                error={errors.lastName}
                                orientation="vertical"
                            />
                        </div>

                        <div className="mt-5 grid gap-5 sm:grid-cols-2">
                            <Input
                                name="username"
                                value={formData.username}
                                onChange={(e) => setFieldValue('username', e.target.value)}
                                label={{ content: firstCap(t('auth.register.inputs.username.label')) }}
                                placeholder={firstCap(t('auth.register.inputs.username.placeholder'))}
                                inputClassName={INPUT_CLASSNAME}
                                error={errors.username}
                                orientation="vertical"
                            />
                            <Input
                                name="email"
                                value={formData.email}
                                onChange={(e) => setFieldValue('email', e.target.value)}
                                label={{ content: firstCap(t('auth.register.inputs.email.label')) }}
                                placeholder={firstCap(t('auth.register.inputs.email.placeholder'))}
                                inputClassName={INPUT_CLASSNAME}
                                error={errors.email}
                                orientation="vertical"
                            />
                        </div>

                        <div className="mt-5 grid gap-5 sm:grid-cols-2">
                            <div className="flex flex-col">
                                <label htmlFor="phone_input" className='cursor-pointer text-sm font-medium text-[rgb(var(--color-text-muted))] whitespace-nowrap overflow-hidden text-ellipsis min-w-0 mb-2'>{firstCap(t('auth.register.inputs.phoneNumber.label'))}</label>
                                <PhoneInput
                                    id='phone_input'
                                    placeholder={firstCap(t('borrowers.addBorrowerPage.inputs.phone.placeholder'))}
                                    name='phone'
                                    style={{ backgroundColor: 'rgb(var(--color-surface))' }}
                                    className={`rounded-md border-transparent h-10 px-3 mb-1.5 bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))] text-sm`}
                                    onChange={(value: string) => {
                                        setFieldValue('phoneNumber', value);
                                    }}
                                    value={formData.phoneNumber}
                                />
                                {errors.phoneNumber && (
                                    <span className="text-red-500 text-(length:--fs-caption)">
                                        {firstCap(t(`auth.register.inputs.phoneNumber.errors.${errors.phoneNumber}`))}
                                    </span>
                                )}
                            </div>
                            <div className="">
                                <DropDownMenu
                                    label={
                                        <span className='cursor-pointer text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0 mb-2'>{firstCap(t('auth.register.inputs.phoneNumber.label'))}</span>
                                    }
                                    className='cursor-not-allowed'
                                    fontSize='0.875rem'
                                    height='35px'
                                    options={[
                                        {
                                            label: firstCap(t('common.roles.admin')),
                                            value: 'admin',
                                        },
                                    ]}
                                    onSelect={() => { }}
                                    isDisabled
                                >
                                    {firstCap(t('common.roles.admin'))}
                                </DropDownMenu>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-5 sm:grid-cols-2">
                            <Input
                                name="password"
                                value={formData.password}
                                onChange={(e) => setFieldValue('password', e.target.value)}
                                label={{ content: firstCap(t('auth.register.inputs.password.label')) }}
                                placeholder="••••••••••••"
                                inputType="password"
                                inputClassName={INPUT_CLASSNAME}
                                error={errors.password}
                                helperText={firstCap(t('auth.setup.passwordHint', {
                                    defaultValue: 'Debe tener al menos {{count}} caracteres, una mayúscula, un número y un símbolo.',
                                    count: passwordMinLength,
                                }))}
                                orientation="vertical"
                            />
                            <Input
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={(e) => setFieldValue('confirmPassword', e.target.value)}
                                label={{ content: firstCap(t('auth.setup.confirmPassword', { defaultValue: 'Confirmar contraseña' })) }}
                                placeholder="••••••••••••"
                                inputType="password"
                                inputClassName={INPUT_CLASSNAME}
                                error={errors.confirmPassword}
                                orientation="vertical"
                            />
                        </div>

                        {errors.form && (
                            <div className="mt-6 rounded-md border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-red-500">
                                {errors.form}
                            </div>
                        )}

                        <div className="mt-8 flex-col grid items-center grid-cols-2 gap-4">
                            <p className="text-sm text-[rgb(var(--color-text-muted))]">
                                {firstCap(t('auth.setup.footer', { defaultValue: 'Cuando termines, ingresarás automáticamente al sistema.' }))}
                            </p>
                            <Button
                                onClick={handleSubmit}
                                isLoading={submitStatus === 'loading'}
                                className="rounded-md px-6 py-3"
                                rightIcon={<span className="material-symbols-outlined text-lg">arrow_forward</span>}
                            >
                                {firstCap(t('auth.setup.submit', { defaultValue: 'Ingresar' }))}
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
