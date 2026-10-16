import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Input,
  SelectMenu
} from '@/shared/components/ui';

import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css'

import { useTranslation } from 'react-i18next';
import { firstCap } from '@/shared/utils/firstCap';
import { geoApi } from '../api/geo.api';

import type { CreateBorrowerDTO, CreateBorrowerErrors, DataStatus } from "@Libsoft/shared-types";
import { borrowersApi } from '../api/borrowers.api';
import { useNavigate } from 'react-router-dom';

export function AddBorrowerPage() {

  const { t } = useTranslation();
  const navigate = useNavigate();

  const [addressSuggestions, setAddressSuggestions] = useState<{ nomenclatura: string }[]>([]);

  const [submitStatus, setSubmitStatus] = useState<DataStatus>('idle');
  const [addressSearchQuery, setAddressSearchQuery] = useState<string>('');
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [newBorrowerData, setNewBorrowerData] = React.useState<CreateBorrowerDTO>({
    // ...FORM_DATA_TEST
    firstName: 'Franco',
    lastName: 'Couturier',
    email: 'francocouturier@gmail.com',
    phone: '5491112345678',
    gender: 'male',
    address: 'Hipolito Yrigoyen',
    dni: '12345678',
  });

  const [errors, setErrors] = React.useState<CreateBorrowerErrors>({});

  const handleSubmit = async () => {

    setErrors({});
    setSubmitStatus('loading');

    try {
      await borrowersApi.create(newBorrowerData);
      setSubmitStatus('success');
      navigate('/borrowers');
    } catch (error: any) {
      setErrors(error.data.errors)
      setSubmitStatus('error');
    }
  }

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof CreateBorrowerDTO;

    if (fieldName === 'address') {
      setAddressSearchQuery(value);
    }

    setNewBorrowerData((prev) => ({
      ...prev,
      [name]: name === 'year' ? (value ? Number(value) : undefined) : value,
    }));

    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const handleSelectChange = (fieldName: keyof CreateBorrowerDTO, value: string) => {
    setNewBorrowerData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const handleGeoSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const result = await geoApi.searchAddresses(searchQuery, 5);
      setAddressSuggestions(result.direcciones as { nomenclatura: string }[]);

    } catch (error) {
      console.error('Error buscando direcciones GeoRef:', error);
    }
  };

  useEffect(() => {
    if (addressDebounceRef.current) {
      clearTimeout(addressDebounceRef.current);
    }

    addressDebounceRef.current = setTimeout(() => {
      handleGeoSearch(addressSearchQuery);
    }, 300);

    return () => {
      if (addressDebounceRef.current) {
        clearTimeout(addressDebounceRef.current);
      }
    };
  }, [addressSearchQuery]);

  return (
    <div className='flex flex-col h-full w-full'>
      <div className='p-6'>
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text))] flex flex-row items-center gap-2">
          {firstCap(t('borrowers.addBorrowerPage.section'))}
        </h1>
        <p className="text-[rgb(var(--color-text-muted))]/60 mt-1 text-sm">
          {firstCap(t('borrowers.addBorrowerPage.subtitle'))}
        </p>
      </div>
      <div className='flex flex-col gap-8 flex-1 px-[15%] pb-[15%] relative'>
        <div className='w-full flex flex-row'>
          <label htmlFor='firstName_input' className='text-sm font-medium text-[rgb(var(--color-text-muted))] mt-2 w-62.5 cursor-pointer'>
            {firstCap(t('borrowers.addBorrowerPage.inputs.firstName.label'))}
          </label>
          <Input
            id='firstName_input'
            name='firstName'
            className='flex-1 mr-3'
            inputClassName='border-transparent shadow-sm rounded-md text-[length:var(--fs-body-sm)]'
            placeholder={firstCap(t('borrowers.addBorrowerPage.inputs.firstName.placeholder'))}
            onChange={handleFormChange}
            error={errors?.firstName}
          ></Input>
          <Input
            name='lastName'
            className='flex-1'
            inputClassName='border-transparent shadow-sm rounded-md text-[length:var(--fs-body-sm)]'
            placeholder={firstCap(t('borrowers.addBorrowerPage.inputs.lastName.placeholder'))}
            onChange={handleFormChange}
            error={errors?.lastName}
          ></Input>
        </div>
        <div className='w-full flex flex-row gap-3'>
          <Input
            className='flex-1'
            inputClassName='border-transparent shadow-sm rounded-md text-[length:var(--fs-body-sm)]'
            placeholder={firstCap(t('borrowers.addBorrowerPage.inputs.dni.placeholder'))}
            name='dni'
            orientation='horizontal'
            label={{
              content: <span>{firstCap(t('borrowers.addBorrowerPage.inputs.dni.label'))}</span>,
              width: '250px',
              height: '200px',
            }}
            onChange={handleFormChange}
            error={errors?.dni}
          ></Input>
        </div>
        <div className='w-full flex flex-row gap-3'>
          <Input
            className='flex-1'
            inputClassName='border-transparent shadow-sm rounded-md text-[length:var(--fs-body-sm)]'
            placeholder={firstCap(t('borrowers.addBorrowerPage.inputs.email.placeholder'))}
            name='email'
            orientation='horizontal'
            label={{
              content: <span>{firstCap(t('borrowers.addBorrowerPage.inputs.email.label'))}</span>,
              width: '250px',
              height: '200px',
            }}
            onChange={handleFormChange}
            error={errors?.email}
          ></Input>
        </div>
        <div className='w-full flex flex-col gap-3 relative'>
          <div className='w-full flex flex-row items-center'>
            <label htmlFor='phone_input' className='text-sm font-medium text-[rgb(var(--color-text-muted))] mt-2 w-62.5 cursor-pointer'>
              {firstCap(t('borrowers.addBorrowerPage.inputs.phone.label'))}
            </label>
            <PhoneInput
              id='phone_input'
              placeholder={firstCap(t('borrowers.addBorrowerPage.inputs.phone.placeholder'))}
              name='phone'
              style={{ backgroundColor: 'rgb(var(--color-bg))' }}
              className='px-4 py-2 flex-1 bg-[rgb(var(--color-bg)) shadow-sm border-[rgb(var(--color-border))] rounded-md text-(length:--fs-body-sm) text-[rgb(var(--color-text))] flex flex-row gap-1'
              onChange={(value: string) => {
                handleFormChange({ target: { name: 'phone', value } } as React.ChangeEvent<HTMLInputElement>);
              }}
              value={newBorrowerData.phone}
            />
          </div>
          {errors?.phone &&
            <span className="text-red-500 text-xs mt-1 pl-62.5">
              {errors.phone}
            </span>
          }
        </div>
        <div className='w-full'>
          <SelectMenu
            label={{
              text: firstCap(t('common.genders.gender')),
              width: '250px',
              heigth: '43px',
              className: 'text-sm font-semibold flex items-center text-[rgb(var(--color-text-muted))]'
            }}
            className='w-full'
            value={newBorrowerData.gender}
            options={[
              { label: firstCap(t('common.genders.male')), value: "male" },
              { label: firstCap(t('common.genders.female')), value: "female" },
              { label: firstCap(t('common.other')), value: "other" },
            ]}
            error={errors?.gender}
            onSelect={(value) => handleSelectChange('gender', value)}
            orientation='horizontal'
          />
        </div>
        <div className='w-full flex flex-col gap-3'>
          <Input
            label={{
              content: <span>{firstCap(t('borrowers.addBorrowerPage.inputs.address.label'))}</span>,
              width: '250px',
              height: '200px',
            }}
            className='w-full'
            inputClassName='border-transparent shadow-sm rounded-md text-[length:var(--fs-body-sm)]'
            placeholder={firstCap(t('borrowers.addBorrowerPage.inputs.address.placeholder'))}
            name='address'
            value={newBorrowerData.address}
            orientation='horizontal'
            onChange={handleFormChange}
            error={errors?.address}
            suggestions={addressSuggestions.map(sug => (
              { value: sug.nomenclatura, label: sug.nomenclatura }
            ))}
          />
        </div>
        <div className='flex justify-end gap-3'>
          <Button
            className='text-(length:--fs-body) rounded-md' onClick={handleSubmit} isLoading={submitStatus === 'loading'}
            disabled={submitStatus === 'loading'}
          >
            {firstCap(t('borrowers.addBorrowerPage.submit'))}
          </Button>
        </div>
      </div>
    </div >
  );
}
