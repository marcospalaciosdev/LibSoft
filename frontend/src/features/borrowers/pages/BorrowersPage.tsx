import { useState, useEffect } from 'react';
import { PaginationFooter } from '@/shared/components/ui';
import type { BorrowerDTO, DataStatus } from "@Libsoft/shared-types";

import {
  Button,
  Badge,
  Spinner,
  Input
} from '@/shared/components/ui';
import { ErrorState } from '@/shared/components/feedback';
import { useTranslation } from 'react-i18next';
import { firstCap } from '@/shared/utils/firstCap';

import { useNavigate } from 'react-router-dom';
import { borrowersApi } from '../api/borrowers.api';
import { SectionHeader } from '@/shared/components/layout/SectionHeader';

export function BorrowersPage() {

  const [search, setSearch] = useState<string>('');

  const [filter, setFilter] = useState<string>('all');
  const [borrowers, setBorrowers] = useState<BorrowerDTO[]>([]);

  const [borrowersAmount, setBorrowersAmount] = useState<number | null>();

  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);

  const [tabStatus, setTabStatus] = useState<DataStatus>('loading');

  const navigate = useNavigate();

  const fetchBorrowersAmount = async () => {
    try {
      const data = await borrowersApi.getAmount();
      setBorrowersAmount(data as any);
    } catch (error) {
      console.error('Error al obtener la cantidad de prestamistas:', error);
    }
  };

  const fetchBorrowers = async () => {
    try {
      setTabStatus('loading');
      const response = await borrowersApi.getAll({
        limit: limit,
        offset: offset,
        status: filter as any,
        name: search || undefined
      });
      const data = Array.isArray(response) ? response : (response as any).data;
      const total = Array.isArray(response) ? response.length : (response as any).total;
      setBorrowers(data || []);
      if (total !== undefined) setBorrowersAmount(total);
      setTabStatus('success');
    } catch (error) {
      console.error('Error al obtener los prestamistas:', error);
      setTabStatus('error');
    }
  }

  useEffect(() => {
    fetchBorrowersAmount();
  }, []);

  useEffect(() => {
    setOffset(0);
    fetchBorrowers();
  }, [limit]);

  useEffect(() => {
    fetchBorrowers();
  }, [offset]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0);
      fetchBorrowers();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, filter]);

  const { t } = useTranslation();

  const filterOptions = [
    { value: 'all', label: firstCap(t('common.all')) },
    { value: 'enabled', label: firstCap(t('common.statusValues.enabled')) },
    { value: 'disabled', label: firstCap(t('common.statusValues.disabled')) },
  ];

  return (
    <>
      {tabStatus === 'loading' ? (
        <div className='flex justify-center items-center w-full h-full'>
          <Spinner size='lg' color='rgb(var(--color-primary-500))' />
        </div>
      ) : tabStatus === 'error' ? (
        <ErrorState
          title={firstCap(t('common.errorMessages.error'))}
          message={firstCap(t('borrowers.errors.loadingBorrowers'))}
          retryLabel={firstCap(t('common.actions.retry'))}
          onRetry={() => {
            fetchBorrowers();
            fetchBorrowersAmount();
          }}
        />
      ) : tabStatus === 'success' ? (
        <div className="flex flex-col w-full h-full min-h-0 relative p-6 animate-fade-in">
          <SectionHeader
            title={firstCap(t(`borrowers.section`))}
            description={firstCap(t(`borrowers.description`))}
            icon='badge'
          >
            <Button
              size="sm"
              className='flex flex-row items-center py-1.5 px-3 h-fit bg-[rgb(var(--color-primary-500))] rounded-sm hover:bg-[rgb(var(--color-primary-600))]'
              leftIcon={<span className='material-symbols-outlined text-(length:--fs-body)!'>add</span>}
              onClick={() => navigate('/borrowers/new')}
            >
              <span className='text-(length:--fs-caption)!'>{firstCap(t('borrowers.actions.addBorrower'))}</span>
            </Button>
          </SectionHeader>
          <div className='flex flex-row justify-between mb-4'>
            <nav className='flex flex-row gap-2 h-8.75'>
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value as any)}
                  className={`px-4 h-full rounded-md text-sm font-medium transition-all duration-200 border-none outline-none cursor-pointer
                    ${filter === option.value
                      ? 'bg-[rgb(var(--color-primary-500))] text-white shadow-md'
                      : 'bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface))]'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </nav>
            <Input
              type="text"
              className='border-transparent'
              inputClassName='text-[length:var(--fs-body-sm)] border-transparent! rounded-md min-w-100'
              placeholder={firstCap(t('borrowers.searchPlaceholder'))}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 min-h-0 flex flex-col w-full border border-[rgb(var(--color-border))] rounded-md overflow-hidden">
            <div className="w-full bg-[rgb(var(--color-bg))] border-collapse">
              <ul className="bg-[rgb(var(--color-bg-secondary))] sticky top-0 z-10 grid grid-cols-5">
                <li className="text-left px-6 py-3 text-xs font-medium text-[rgb(var(--color-text-muted))]/60 uppercase tracking-wider border-b border-[rgb(var(--color-border))]">
                  {firstCap(t('common.name'))}
                </li>
                <li className="text-left px-6 py-3 text-xs font-medium text-[rgb(var(--color-text-muted))]/60 uppercase tracking-wider border-b border-[rgb(var(--color-border))]">
                  DNI
                </li>
                <li className="text-left px-6 py-3 text-xs font-medium text-[rgb(var(--color-text-muted))]/60 uppercase tracking-wider border-b border-[rgb(var(--color-border))]">
                  {firstCap(t('common.status'))}
                </li>
                <li className="text-left pl-6 py-3 -ml-1.5 text-xs font-medium text-[rgb(var(--color-text-muted))]/60 uppercase tracking-wider border-b border-[rgb(var(--color-border))]">
                  {firstCap(t('common.inputs.phoneNumber'))}
                </li>
                <li className="text-left px-6 py-3 text-xs font-medium text-[rgb(var(--color-text-muted))]/60 uppercase tracking-wider border-b border-[rgb(var(--color-border))]">
                  {firstCap(t('common.actions.actions'))}
                </li>
              </ul>
            </div>
            <div className="bg-[rgb(var(--color-bg))] flex-1 overflow-y-auto">
              {borrowers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center w-full h-full">
                  <div className='flex flex-col items-center justify-center gap-2 opacity-40'>
                    <span className='text-[rgb(var(--color-text))] material-symbols-outlined text-5xl'>person_off</span>
                    <span className='text-[rgb(var(--color-text))] text-sm uppercase font-semibold'>{firstCap(t('borrowers.noBorrowersFound'))}</span>
                  </div>
                </div>
              ) : (
                borrowers.map((borrower: any) => (
                  <ul key={borrower.id} className="bg-[rgb(var(--color-bg))] cursor-pointer hover:bg-[rgb(var(--color-bg-secondary))] transition-colors border-b border-[rgb(var(--color-border))] group grid grid-cols-5">
                    <li className="flex items-center py-2 px-6 text-sm font-medium text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary-500))] transition-colors">{`${borrower.firstName || (borrower as any).name || ''} ${borrower.lastName || (borrower as any).surname || ''}`.trim()}</li>
                    <li className="flex items-center py-2 px-6 text-sm text-[rgb(var(--color-text-muted))]">{borrower.dni}</li>
                    <li className="flex items-center py-2 px-6 text-sm">
                      <Badge variant={borrower.status === 'enabled' ? 'success' : borrower.status === 'withDebt' ? 'warning' : 'error'}>
                        {firstCap(t('common.statusValues.' + borrower.status))}
                      </Badge>
                    </li>
                    <li className="flex items-center py-2 px-6 text-sm font-mono text-[rgb(var(--color-text-muted))]/70">{borrower.phone}</li>
                    <li className="flex items-center py-2 px-6">
                      <Button
                        variant="ghost"
                        onClick={() => navigate(`/borrowers/manage/${borrower.id}`)}
                        className="aspect-square p-1.5! rounded-md text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-500))] hover:bg-[rgb(var(--color-primary-500))]/10 transition-all duration-200 flex items-center justify-center cursor-pointer"
                        tooltip={{ text: firstCap(t('borrowers.actions.editBorrower')), fontSize: 10 }}
                      >
                        <span className="material-symbols-outlined text-(length:--fs-body)">edit</span>
                      </Button>
                    </li>
                  </ul>
                ))
              )}
            </div>
            <PaginationFooter
              limitOptions={[limit, 20, 50, 100]}
              limit={limit}
              offset={offset}
              totalItems={borrowersAmount || 0}
              onLimitChange={(newLimit) => { setLimit(newLimit); setOffset(0); }}
              onPageChange={(newOffset) => setOffset(newOffset)}
              resultsPerPageLabel={
                <span className='text-(length:--fs-caption) text-[rgb(var(--color-text-muted))]'>{firstCap(t('common.resultsPerPage'))}</span>
              }
              resultsCountText={(visible, total) => firstCap(t('common.results_count', { count: `${visible} / ${total}` }))}
            />
          </div>
        </div >
      ) : (
        <span></span>
      )}
    </>
  );
}
