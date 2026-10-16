import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { firstCap } from '@/shared/utils/firstCap';
import type {
    BorrowerDTO,
    UpdateBorrowerDTO,
    UpdateBorrowerErrors,
    DataStatus
} from "@Libsoft/shared-types";
import { borrowersApi } from '../api/borrowers.api';

import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css'
import {
    Input,
    Button,
    SelectMenu,
    Spinner
} from '@/shared/components/ui';
import { ErrorState } from '@/shared/components/feedback';

const statusOptions = [
    { label: 'Enabled', value: 'enabled' },
    { label: 'Disabled', value: 'disabled' }
];

const statusOptions_className = "bg-[rgb(var(--color-bg-secondary))] rounded-md border-transparent hover:bg-[rgb(var(--color-bg-secondary))]/80 transition-colors ";

const createInitialBorrowerFormData = (): UpdateBorrowerDTO => ({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    status: 'enabled',
    dni: '',
    phone: '',
    createdAt: '',
    id: '',
});

export function EditBorrowerPage() {
    const { id } = useParams();

    const [borrowerDataStatus, setBorrowerDataStatus] = useState<DataStatus>('loading');
    const [saveBorrowerStatus, setSaveBorrowerStatus] = useState<DataStatus>('idle');

    const [accountStatus, setAccountStatus] = useState<string>('');
    const [showDisableReason, setShowDisableReason] = useState<boolean>(false);
    const [disableReason, setDisableReason] = useState<string>('');
    const statusWrapperRef = useRef<HTMLDivElement>(null);
    const formDataRef = useRef<UpdateBorrowerDTO>(createInitialBorrowerFormData());
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [errors, setErrors] = useState<any>();

    const [formData, setFormData] = useState<UpdateBorrowerDTO>(() => createInitialBorrowerFormData());

    const fetchBorrower = async () => {
        try {
            setBorrowerDataStatus('error');
            const data = await borrowersApi.getById(id as string);
            const borrowerData = data as UpdateBorrowerDTO;

            setFormData(borrowerData);
            formDataRef.current = borrowerData;
            setAccountStatus(borrowerData.status);
            setDisableReason(borrowerData.disableReason ?? '');
            setShowDisableReason(borrowerData.status === 'disabled');
            setBorrowerDataStatus('success');
        } catch (error) {
            console.error('Error al obtener el socio:', error);
            setBorrowerDataStatus('error');
        }
    };

    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    useEffect(() => {
        fetchBorrower();
    }, [id]);

    useEffect(() => {
        if (!showDisableReason) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (statusWrapperRef.current && !statusWrapperRef.current.contains(event.target as Node)) setShowDisableReason(false);
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [showDisableReason]);

    const updateFormData = (updater: (prev: UpdateBorrowerDTO) => UpdateBorrowerDTO) => {
        setFormData((prev) => {
            const updatedFormData = updater(prev);
            formDataRef.current = updatedFormData;
            return updatedFormData;
        });
    };

    const handleFieldChange = (field: keyof UpdateBorrowerDTO, value: string) => {
        updateFormData((prev) => ({
            ...prev,
            [field]: value,
        } as UpdateBorrowerDTO));
    };

    const handleInputChange = (value: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof UpdateBorrowerDTO) => {
        handleFieldChange(field, value.target.value);
    };

    const handleStatusChange = (value: string) => {
        setAccountStatus(value);
        updateFormData((prev) => ({
            ...prev,
            status: value as BorrowerDTO['status'],
            disableReason: value === 'disabled' ? prev.disableReason ?? '' : '',
        } as UpdateBorrowerDTO));
        setShowDisableReason(value === 'disabled');

        if (value !== 'disabled') setDisableReason('');
    };

    const handleDisableReasonChange = (value: string) => {
        setDisableReason(value);
        updateFormData((prev) => ({
            ...prev,
            disableReason: value,
        } as UpdateBorrowerDTO));
    };

    const handleSave = async () => {
        try {
            setSaveBorrowerStatus('loading');
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                dni: formData.dni,
                email: formData.email,
                phone: formData.phone,
                address: formData.address || '',
                status: formData.status,
                disableReason: disableReason,
            };
            await borrowersApi.update(id as string, payload);
            setSaveBorrowerStatus('success');
        } catch (error: any) {

            setErrors(error.data.errors as UpdateBorrowerErrors);
            setSaveBorrowerStatus('error');
        }
    };

    return (
        <div className='flex flex-col flex-1 animate-fade-in'>
            {borrowerDataStatus === 'loading' ? (
                <div className='flex-1 w-full flex items-center justify-center min-h-[300px]'>
                    <Spinner
                        size='lg'
                        color='rgb(var(--color-primary-500))'
                    />
                </div>
            ) : borrowerDataStatus === 'error' ? (
                <ErrorState
                    className='flex-1'
                    title={firstCap(t('common.errorMessages.error'))}
                    message={firstCap(t('borrowers.manageBorrowerPage.errors.loadingBorrower'))}
                    retryLabel={firstCap(t('common.actions.retry'))}
                    onRetry={fetchBorrower}
                />
            ) : (
                <>
                    <div className='grid grid-cols-[1fr_350px] gap-5'>
                        <div className='flex flex-col gap-5'>
                            <div className='bg-[rgb(var(--color-bg))] p-7 rounded-md h-fit flex flex-col'>
                                <div className='flex flex-row gap-5 items-center'>
                                    <span className='material-symbols-outlined text-[rgb(var(--color-primary-500))] text-[length:--fs-title]'>card_membership</span>
                                    <span className='text-[rgb(var(--color-text))] font-bold text-(length:--fs-caption) uppercase tracking-wider'>{firstCap(t('borrowers.manageBorrowerPage.editBorrower.personalInfo'))}</span>
                                </div>
                                <div className='grid grid-cols-2 gap-5 mt-5 flex-1'>
                                    <Input
                                        error={errors?.firstName && firstCap(t(`borrowers.manageBorrowerPage.editBorrower.inputs.firstName.errors.${errors.firstName}`))}
                                        onChange={(value) => { handleInputChange(value, 'firstName') }}
                                        inputClassName='mb-2 text-[length:var(--fs-body-sm)] bg-[rgb(var(--color-bg-secondary))] border-transparent rounded-md'
                                        label={{
                                            content: <span>{firstCap(t('borrowers.manageBorrowerPage.editBorrower.inputs.firstName.label'))}</span>,
                                            width: '250px',
                                            height: '45px',
                                        }}
                                        placeholder={firstCap(t('borrowers.manageBorrowerPage.editBorrower.inputs.firstName.placeholder'))}
                                        value={`${formData.firstName}`.trim()}
                                    />
                                    <Input
                                        error={errors?.lastName && firstCap(t(`borrowers.manageBorrowerPage.editBorrower.inputs.lastName.errors.${errors.lastName}`))}
                                        onChange={(value) => { handleInputChange(value, 'lastName') }}
                                        inputClassName='mb-2 text-[length:var(--fs-body-sm)] bg-[rgb(var(--color-bg-secondary))] border-transparent rounded-md'
                                        label={{
                                            content: <span>{firstCap(t('borrowers.manageBorrowerPage.editBorrower.inputs.lastName.label'))}</span>,
                                            width: '250px',
                                            height: '45px',
                                        }}
                                        placeholder={firstCap(t('borrowers.manageBorrowerPage.editBorrower.inputs.lastName.placeholder'))}
                                        value={`${formData.lastName}`.trim()}
                                    />
                                    <Input
                                        error={errors?.dni && firstCap(t(`borrowers.manageBorrowerPage.editBorrower.inputs.dni.errors.${errors.dni}`))}
                                        onChange={(value) => { handleInputChange(value, 'dni') }}
                                        inputClassName='mb-2 text-[length:var(--fs-body-sm)] bg-[rgb(var(--color-bg-secondary))] border-transparent rounded-md opacity-50'
                                        label={{
                                            content: <span>{firstCap(t('borrowers.manageBorrowerPage.editBorrower.inputs.dni.label'))}</span>,
                                            width: '250px',
                                            height: '45px,'
                                        }}
                                        value={formData.dni}
                                        disabled
                                    />
                                    <div className='w-full flex flex-col gap-3 relative'>
                                        <div className='w-full flex flex-col'>
                                            <label htmlFor='phone_input' className='text-sm font-medium text-[rgb(var(--color-text-muted))] mb-2 w-62.5 cursor-pointer'>
                                                {firstCap(t('borrowers.addBorrowerPage.inputs.phone.label'))}
                                            </label>
                                            <PhoneInput
                                                id='phone_input'
                                                placeholder={firstCap(t('borrowers.addBorrowerPage.inputs.phone.placeholder'))}
                                                name='phone'
                                                style={{ backgroundColor: 'rgb(var(--color-bg-secondary))' }}
                                                className='px-4 py-2.25 flex-1 bg-[rgb(var(--color-bg)) border-[rgb(var(--color-border))] rounded-md text-(length:--fs-body-sm) text-[rgb(var(--color-text))] flex flex-row gap-1'
                                                onChange={(value: string) => {
                                                    handleFieldChange('phone', value as string,);
                                                }}
                                                value={formData.phone}
                                            />
                                        </div>
                                        {errors?.phone &&
                                            <span className="text-red-500 text-xs mt-1 pl-62.5">
                                                {errors.phone}
                                            </span>
                                        }
                                    </div>

                                </div>
                            </div>
                            <div className='bg-[rgb(var(--color-bg))] p-7 rounded-md h-fit flex flex-col'>
                                <div className='flex flex-row gap-5 items-center'>
                                    <span className='material-symbols-outlined text-[rgb(var(--color-primary-500))] text-[length:--fs-title]'>contact_page</span>
                                    <span className='text-[rgb(var(--color-text))] font-bold text-(length:--fs-caption) uppercase tracking-wider'>{firstCap(t('borrowers.manageBorrowerPage.editBorrower.contactInfo'))}</span>
                                </div>
                                <div className='grid grid-cols-2 items-center gap-5 mt-5 flex-1'>
                                    <Input
                                        error={errors?.email && firstCap(t(`borrowers.manageBorrowerPage.editBorrower.inputs.email.errors.${errors.email}`))}
                                        onChange={(value) => { handleInputChange(value, 'email') }}
                                        inputClassName='mb-2 text-[length:var(--fs-body-sm)] bg-[rgb(var(--color-bg-secondary))] border-transparent rounded-md'
                                        label={{
                                            content: <span>{firstCap(t('borrowers.manageBorrowerPage.editBorrower.inputs.email.label'))}</span>,
                                            height: '',
                                            width: '100%'
                                        }}
                                        value={formData.email}
                                        placeholder={firstCap(t('borrowers.manageBorrowerPage.editBorrower.inputs.email.placeholder'))}
                                    />
                                    <Input
                                        error={errors?.address && firstCap(t(`borrowers.manageBorrowerPage.editBorrower.inputs.address.errors.${errors.address}`))}
                                        onChange={(value) => { handleInputChange(value, 'address') }}
                                        inputClassName='mb-2 text-[length:var(--fs-body-sm)] bg-[rgb(var(--color-bg-secondary))] border-transparent rounded-md'
                                        label={{
                                            content: <span>{firstCap(t('borrowers.manageBorrowerPage.editBorrower.inputs.address.label'))}</span>,
                                            height: '',
                                            width: '100%'
                                        }}
                                        value={formData.address}
                                        placeholder={firstCap(t('borrowers.manageBorrowerPage.editBorrower.inputs.address.placeholder'))}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className='flex flex-col h-full gap-5'>
                            <div className='flex flex-col justify-between h-[65%] bg-[rgb(var(--color-bg))] p-7 rounded-md gap-4'>
                                <div className='flex flex-row gap-4 items-center mb-2'>
                                    <span className='material-symbols-outlined text-[rgb(var(--color-primary-500))] text-[length:--fs-title]'>manage_accounts</span>
                                    <span className='text-[rgb(var(--color-text))] font-bold text-(length:--fs-caption) uppercase tracking-wider'>{firstCap(t('borrowers.manageBorrowerPage.editBorrower.accountStatus.title'))}</span>
                                </div>

                                <div ref={statusWrapperRef} className='relative h-full'>
                                    <SelectMenu
                                        options={statusOptions.map((option) => ({
                                            label: firstCap(t(`borrowers.manageBorrowerPage.editBorrower.accountStatus.${option.value}`)),
                                            value: option.value,
                                            className: statusOptions_className
                                        }))}
                                        className='w-full mt-2 flex-1 h-full'
                                        value={accountStatus}
                                        onSelect={handleStatusChange}
                                        notNullable
                                    />

                                    {showDisableReason && (
                                        <div className='mt-3 rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-secondary))] p-3 shadow-sm absolute w-full'>
                                            <Input
                                                inputType='textarea'
                                                onChange={(event) => handleDisableReasonChange(event.target.value)}
                                                inputClassName='mb-2 text-[length:var(--fs-body-sm)] bg-[rgb(var(--color-bg))] border-transparent rounded-md min-h-[96px] text-[length:var(--fs-body-sm)]'
                                                label={{
                                                    content: <span>{firstCap(t('borrowers.manageBorrowerPage.editBorrower.accountStatus.disableReasonLabel'))}</span>,
                                                    width: '100%',
                                                    height: 'auto',
                                                }}
                                                placeholder={firstCap(t('borrowers.manageBorrowerPage.editBorrower.accountStatus.disableReasonPlaceholder'))}
                                                value={disableReason}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className='flex items-start gap-3 p-3 bg-[rgb(var(--color-primary-500))]/5 rounded-md mt-2 border border-[rgb(var(--color-primary-500))]/10'>
                                    <span className='material-symbols-outlined text-[rgb(var(--color-primary-500))] text-(length:--fs-body) mt-0.5'>info</span>
                                    <span className='text-[rgb(var(--color-primary-500))] text-(length:--fs-caption) font-medium leading-relaxed'>
                                        {firstCap(t('borrowers.manageBorrowerPage.editBorrower.accountStatus.warning'))}
                                    </span>
                                </div>
                            </div>
                            <div className='bg-[rgb(var(--color-primary-500))]/5 border border-[rgb(var(--color-primary-500))]/20 p-7 rounded-md h-[30%] flex flex-col '>
                                <div className='flex flex-row gap-4 items-center mb-2'>
                                    <span className='material-symbols-outlined text-[rgb(var(--color-primary-500))] text-[length:--fs-title]'>search_activity</span>
                                    <span className='text-[rgb(var(--color-text))] font-bold text-(length:--fs-caption) uppercase tracking-wider'>{firstCap(t('borrowers.manageBorrowerPage.editBorrower.activity.title'))}</span>
                                </div>
                                <div className='flex flex-col justify-center gap-2 flex-1'>
                                    <div className='flex flex-row justify-between items-center w-full '>
                                        <span className='text-[rgb(var(--color-text-muted))] font-medium text-(length:--fs-caption)'>{firstCap(t('borrowers.manageBorrowerPage.editBorrower.activity.totalLoans'))}</span>
                                        <span className='text-[rgb(var(--color-text))] font-medium text-(length:--fs-body-sm)'>2</span>
                                    </div>
                                    <div className='flex flex-row justify-between items-center w-full'>
                                        <span className='text-[rgb(var(--color-text-muted))] font-medium text-(length:--fs-caption)'>{firstCap(t('borrowers.manageBorrowerPage.editBorrower.activity.returnedOnTime'))}</span>
                                        <span className='text-[rgb(var(--color-text))] font-medium text-(length:--fs-body-sm)'>100%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-row justify-end gap-2 mt-5'>
                        <Button
                            className='rounded-md'
                            variant='ghost'
                            disabled={saveBorrowerStatus === 'loading'}
                            onClick={() => {
                                navigate('/borrowers');
                            }}
                        >
                            {firstCap(t('borrowers.manageBorrowerPage.editBorrower.actions.cancel'))}
                        </Button>
                        <Button
                            className='rounded-md'
                            onClick={() => {
                                void handleSave();
                            }}
                            isLoading={saveBorrowerStatus === 'loading'}
                        >
                            {firstCap(t('borrowers.manageBorrowerPage.editBorrower.actions.save'))}
                        </Button>
                    </div>
                </>
            )
            }
        </div>
    );
}
