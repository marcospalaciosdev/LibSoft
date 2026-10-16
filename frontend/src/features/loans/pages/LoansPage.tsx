import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  BarChart,
  ActionMetric,
  Spinner
} from '@/shared/components/ui';
import { firstCap } from '@/shared/utils/firstCap';
import { mapLoansData, loansApi } from '../api/loans.api';
import { TableLoanRow } from '@/features/loans/components/TableLoanRow';
import type {
  Loan,
  LoanDetail,
  ReturnMetricsByMonth,
  LoanSummaryMetrics,
  MetricItem,
  DataStatus
} from '@LibSoft/shared-types';
import { generateLoanSummaryMetricsObject } from '../utils/generateLoanSummaryMetricsObject';
import { SectionHeader } from '@/shared/components/layout/SectionHeader';
import { ErrorState } from '@/shared/components/feedback';

export function LoansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [tabStatus, setTabStatus] = useState<DataStatus>('idle');

  const [loanDetails, setLoanDetails] = useState<Record<string, LoanDetail>>({});

  const [returnMetrics, setReturnMetrics] = useState<ReturnMetricsByMonth[]>([]);
  const [returnMetricsStatus, setReturnMetricsStatus] = useState<DataStatus>('idle');

  const [loanSummaryMetrics, setLoanSummaryMetrics] = useState<LoanSummaryMetrics>();
  const [dynamicMetrics, setDynamicMetrics] = useState<MetricItem[]>([]);
  const [loanSummaryMetricsStatus, setLoanSummaryMetricsStatus] = useState<DataStatus>('idle');

  const fetchReturnMetrics = useCallback(async () => {
    setReturnMetricsStatus('loading');
    try {
      const response = await loansApi.getReturnMetricsByMonth(6);
      setReturnMetrics(response);
      setReturnMetricsStatus('success');
    } catch (error) {
      console.error("Error fetching return metrics:", error);
      setReturnMetricsStatus('error');
    }
  }, []);

  const fetchLoanSummaryMetrics = useCallback(async () => {
    setLoanSummaryMetricsStatus('loading');
    try {
      const response = await loansApi.getLoanSummaryMetrics();
      setLoanSummaryMetrics(response);
      setLoanSummaryMetricsStatus('success');
    } catch (error) {
      console.error("Error fetching loan summary metrics:", error);
      setLoanSummaryMetricsStatus('error');
    }
  }, []);

  const fetchLoans = useCallback(async () => {
    setTabStatus('loading');
    try {
      const params: any = { limit: 10 };

      const response = await loansApi.getAll(params);
      const data = Array.isArray(response) ? response : (response as any).data || [];

      setLoans(data);
      setTabStatus('success');

    } catch (error) {
      console.error("Error fetching loans:", error);
      setTabStatus('error');
    }
  }, []);

  const handleQuickReturnAll = async (e: React.MouseEvent, loanId: string) => {
    e.stopPropagation();
    if (!window.confirm(firstCap(t('common.areYouSure')))) return;

    try {
      setTabStatus('loading');
      await loansApi.returnBook(loanId);
      if (loanDetails[loanId]) {
        setLoanDetails(prev => {
          const updated = { ...prev };
          delete updated[loanId];
          return updated;
        });
      }
      await fetchLoans();
    } catch (error) {
      console.error(`Error returning loan ${loanId}:`, error);
      alert('Error al devolver el préstamo');
    } finally {

    }
  };

  const handleReturnSingleCopy = async (loanId: string, copyId: number) => {
    if (!window.confirm(firstCap(t('common.areYouSure')))) return;

    try {
      await loansApi.returnBook(loanId, [{ copyId, returned: true, returnDate: new Date().toISOString() }]);

      const response = await loansApi.getById(loanId);
      const detailedLoan = (response as any).data || response;
      setLoanDetails(prev => ({
        ...prev,
        [loanId]: detailedLoan
      }));

      const listResponse = await loansApi.getAll({ limit: 2 });
      const listData = Array.isArray(listResponse) ? listResponse : (listResponse as any).data || [];

      setLoans(mapLoansData(listData));

    } catch (error) {
      console.error(`Error returning copy ${copyId} from loan ${loanId}:`, error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setTabStatus('loading');
      try {
        await Promise.all([
          fetchReturnMetrics(),
          fetchLoanSummaryMetrics(),
          fetchLoans(),
        ]);
      } catch (error) {
        console.error("Error al cargar la página de préstamos:", error);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (loanSummaryMetrics) setDynamicMetrics(generateLoanSummaryMetricsObject(loanSummaryMetrics));
  }, [loanSummaryMetrics]);

  return (
    <div className="w-full flex flex-col p-6 animate-fade-in">
      <SectionHeader
        title={firstCap(t(`loans.title`))}
        description={firstCap(t(`loans.description`))}
        icon='menu_book'
      >
        <Button
          variant="default"
          className="flex flex-row items-center bg-[rgb(var(--color-primary-500))] text-white text-xs rounded-sm shadow-sm hover:bg-[rgb(var(--color-primary-600))] transition-all hover:scale-[1.02] active:scale-[0.98]"
          leftIcon={<span className="material-symbols-outlined text-md">add</span>}
          onClick={() => navigate('/loans/new')}
        >
          <span className="font-semibold text-xs">
            {firstCap(t('loans.registerLoan'))}
          </span>
        </Button>
      </SectionHeader>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">

        <div className="flex-1 overflow-hidden bg-[rgb(var(--color-bg))] rounded-2xl border border-[rgb(var(--color-border))]/60 p-6 flex flex-col gap-6 transition-all duration-300">
          {returnMetricsStatus === 'loading' ? (
            <Spinner
              className='h-full'
              color='rgb(var(--color-primary-500))'
            />
          ) : returnMetricsStatus === 'error' ? (
            <ErrorState
              title={firstCap(t('common.errorMessages.failedToLoad'))}
              message={firstCap(t('loans.errors.errorLoadingReturnMetrics'))}
              retryLabel={firstCap(t('common.actions.retry'))}
              onRetry={fetchReturnMetrics}
            />
          ) : returnMetricsStatus === 'success' ? (
            <>
              <div className="flex flex-row justify-between items-center pb-3">
                <h2 className="text-[rgb(var(--color-text))] font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] text-lg">stacked_bar_chart</span>
                  {firstCap(t('loans.inLastMonths'))}
                </h2>
              </div>
              <div className="flex-1 flex items-center min-h-40">
                <BarChart
                  height={120}
                  className="w-full"
                  data={
                    returnMetrics.map(m => ({
                      label: firstCap(t(`common.months.${m.month}`)),
                      values: [m.returnedOnTime, m.returnedLate, m.notReturned],
                      sum: `${m.totalLoans}`
                    }))
                  }
                  datasets={[
                    { label: firstCap(t('common.statusValues.returned')), color: 'rgb(var(--color-success-500))' },
                    { label: firstCap(t('common.statusValues.outOfTime')), color: 'rgb(var(--color-warning-500))' },
                    { label: firstCap(t('common.statusValues.notReturned')), color: 'rgb(var(--color-error-500))' },
                  ]}
                  yAxisLabel={firstCap(t('common.copiesCount'))}
                  showLegend={true}
                />
              </div>
            </>
          ) : null}
        </div>

        <div className={`w-80 h-90 justify-between bg-[rgb(var(--color-bg-secondary))] border border-[rgb(var(--color-border))]/60 gap-px rounded-2xl transition-all duration-300 overflow-hidden
          ${loanSummaryMetricsStatus === 'loading' || loanSummaryMetricsStatus === 'error' ? 'p-6' : 'grid grid-cols-2 grid-rows-3'}`}>
          {loanSummaryMetricsStatus === 'loading' ? (
            <Spinner
              className='h-full'
              color='rgb(var(--color-primary-500))'
            />
          ) : loanSummaryMetricsStatus === 'error' ? (
            <ErrorState
              title={firstCap(t('common.errorMessages.failedToLoad'))}
              message={firstCap(t('loans.errors.errorLoadingLoanSummaryMetrics'))}
              retryLabel={firstCap(t('common.actions.retry'))}
              onRetry={fetchLoanSummaryMetrics}
            />
          ) : loanSummaryMetricsStatus === 'success' ? (

            dynamicMetrics.map(metric => (
              <ActionMetric
                key={metric.metricKey}
                title={firstCap(t(`loans.stats.${metric.metricKey}`))}
                value={metric.value || '--'}
                valueType={metric.valueType}
                icon={metric.icon}
                severity={metric.severity}
                className={metric.className}
              />
            ))
          ) : null}
        </div>
      </div>

      <div className="bg-[rgb(var(--color-bg))] rounded-2xl overflow-hidden border border-[rgb(var(--color-border))]/60">
        <div className="h-75 min-h-75 overflow-x-auto flex flex-col bg-[rgb(var(--color-bg))]">
          {tabStatus === 'loading' ? (
            <Spinner
              className='h-full'
              size="lg"
            />
          ) : tabStatus === 'error' ? (
            <ErrorState
              className=''
              title={firstCap(t('common.errorMessages.error'))}
              message={firstCap(t('loans.errors.errorLoadingLoans'))}
              retryLabel={firstCap(t('common.actions.retry'))}
              onRetry={fetchLoans}
            />
          ) : (
            <table className="w-full min-w-250 border-collapse">
              <thead>
                <tr className="bg-[rgb(var(--color-bg-secondary))]/40 border-b border-[rgb(var(--color-border))]/55">
                  <th className="w-12 py-4 px-4 text-center"></th>
                  <th className="text-left px-4 py-4 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider">
                    {firstCap(t('common.book'))}
                  </th>
                  <th className="text-left px-4 py-4 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider">
                    {firstCap(t('common.roles.borrower'))}
                  </th>
                  <th className="text-left px-4 py-4 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider">
                    {firstCap(t('common.roles.user'))}
                  </th>
                  <th className="text-left px-4 py-4 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider">
                    {firstCap(t('common.date'))}
                  </th>
                  <th className="text-left px-4 py-4 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider">
                    {firstCap(t('common.ending'))}
                  </th>
                  <th className="text-center px-4 py-4 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider w-30">
                    {firstCap(t('common.status'))}
                  </th>
                  <th className="text-right px-4 py-4 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider">
                    {firstCap(t('common.actions.actions'))}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--color-border))]/40">

                {loans.map((loan) => (
                  <TableLoanRow
                    loan={loan}
                    handleQuickReturnAll={handleQuickReturnAll}
                    handleReturnSingleCopy={handleReturnSingleCopy}
                  />
                ))}

                {loans.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-16 h-16 bg-[rgb(var(--color-text-muted))]/5 border border-[rgb(var(--color-border))]/40 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-105">
                          <span className="material-symbols-outlined text-[rgb(var(--color-text-muted))]/40 text-3xl">inbox</span>
                        </div>
                        <p className="text-[rgb(var(--color-text-muted))]/60 text-sm font-medium">
                          {firstCap(t('loans.noLoansRegistered'))}
                        </p>
                        <Button
                          onClick={() => navigate('/loans/new')}
                          variant="primary"
                          className="mt-5 rounded-md"
                        >
                          {firstCap(t('loans.registerYourFirstLoan'))}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Premium ERP Footer Panel with Navigation to Audit Logs */}
        {loans.length > 0 && (
          <div className="p-4 bg-[rgb(var(--color-bg))] border-t border-[rgb(var(--color-border))]/60 flex items-center justify-between px-6">
            <span className="text-xs text-[rgb(var(--color-text-muted))]/60 font-semibold tracking-wide">
              {firstCap(t('loans.resumeLoansTable'))}
            </span>
            <Button
              onClick={() => navigate('/loans/all')}
              variant="ghost"
              className="text-xs font-bold border border-[rgb(var(--color-border))] rounded-md px-4 py-2 hover:bg-[rgb(var(--color-bg-secondary))]/55 flex items-center gap-1.5 transition-all text-[rgb(var(--color-primary-500))] select-none"
              rightIcon={<span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>}
            >
              <span>{firstCap(t('common.watchAll'))}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}