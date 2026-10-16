import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import type { Loan, MetricItem, DataStatus } from "@LibSoft/shared-types";
import { useTranslation } from "react-i18next";

import { loansApi } from "../../loans/api/loans.api";
import { LoansTable } from "../../loans/components/LoansTable";
import { generateLoanSummaryMetricsObject } from "../../loans/utils/generateLoanSummaryMetricsObject";
import { ActionMetric } from "@/shared/components/ui/ActionMetric";
import { Spinner } from "@/shared/components/ui";
import { ErrorState } from "@/shared/components/feedback";
import { firstCap } from "@/shared/utils/firstCap";

export function BorrowerLoanHistory() {
  const { t } = useTranslation();
  const { id: borrowerId } = useParams<{ id: string }>();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanSummaryMetrics, setLoanSummaryMetrics] = useState<MetricItem[]>([]);
  const [pageStatus, setPageStatus] = useState<DataStatus>('loading');
  const [loansActionStatus, setLoansActionStatus] = useState<DataStatus>('idle');
  const [totalLoans, setTotalLoans] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loansPerPage, setLoansPerPage] = useState(10);

  const loadPage = useCallback(async (showLoader = true) => {

    if (!borrowerId) {
      setPageStatus('error');
      return;
    }

    if (showLoader) setPageStatus('loading');

    try {
      const params = {
        borrowerIds: [borrowerId],
        limit: loansPerPage,
        offset: (currentPage - 1) * loansPerPage,
      };

      const [loansData, summaryData] = await Promise.all([
        loansApi.getAll(params),
        loansApi.getLoanSummaryMetrics({ borrowerId }),
      ]);

      setLoans(loansData);
      const filteredTotal = loansData.length > 0 ? (loansData as any[])[0].totalCount ?? loansData.length : 0;
      setTotalLoans(filteredTotal);
      setLoanSummaryMetrics(generateLoanSummaryMetricsObject(summaryData));
      setPageStatus('success');
    } catch (error) {
      console.error("Error fetching borrower loan history:", error);
      setPageStatus('error');
    }
  }, [borrowerId, currentPage, loansPerPage]);

  useEffect(() => { loadPage() }, [loadPage]);

  const handleQuickReturnAll = async (e: React.MouseEvent, loanId: string) => {
    e.stopPropagation();
    if (!window.confirm(firstCap(t('common.areYouSure')))) return;

    try {
      setLoansActionStatus('loading');
      await loansApi.returnBook(loanId);
      await loadPage(false);
      setLoansActionStatus('success');
    } catch (error) {
      console.error(`Error returning loan ${loanId}:`, error);
      setLoansActionStatus('error');
      alert('Error al devolver el pr?stamo');
    }
  };

  const handleReturnSingleCopy = async (loanId: string, copyId: number) => {
    if (!window.confirm(firstCap(t('common.areYouSure')))) return;

    try {
      setLoansActionStatus('loading');
      await loansApi.returnBook(loanId, [{ copyId, returned: true, returnDate: new Date().toISOString() }]);
      await loadPage(false);
      setLoansActionStatus('success');
    } catch (error) {
      console.error(`Error returning copy ${copyId} from loan ${loanId}:`, error);
      setLoansActionStatus('error');
      alert('Error al procesar la devoluci?n de la unidad');
      throw error;
    }
  };

  const handleLoanDelete = async (loanId: string) => {
    if (!window.confirm(firstCap(t('common.areYouSure')))) return;
    try {
      setLoansActionStatus('loading');
      await loansApi.delete(loanId);
      await loadPage(false);
      setLoansActionStatus('success');
    } catch (error) {
      console.error(`Error deleting loan ${loanId}:`, error);
      setLoansActionStatus('error');
      alert('Error al eliminar el pr?stamo');
    }
  };

  const handlePerPageChange = (value: string) => {
    setLoansPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <div className="w-full flex-1 flex flex-col animate-fade-in">
      {pageStatus === 'loading' ? (
        <div className='flex-1 w-full flex justify-center items-center min-h-[300px]'>
          <Spinner size='lg' color='rgb(var(--color-primary-500))' />
        </div>
      ) : pageStatus === 'error' ? (
        <ErrorState
          className="flex-1"
          title={firstCap(t('common.errorMessages.error'))}
          message={firstCap(t('borrowers.manageBorrowerPage.errors.loadingBorrower'))}
          retryLabel={firstCap(t('common.actions.retry'))}
          onRetry={() => loadPage()}
        />
      ) : pageStatus === 'success' ? (
        <div className="w-full flex flex-col gap-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 w-full">
            {loanSummaryMetrics.map((metric) => (
              <ActionMetric
                key={metric.metricKey}
                title={firstCap(t(`loans.stats.${metric.metricKey}`))}
                value={metric.value || '--'}
                valueType={metric.valueType}
                icon={metric.icon}
                severity={metric.severity}
                className={metric.className + ' rounded-md hover:bg-[rgb(var(--color-bg-tertiary))] transition-all duration-150'}
              />
            ))}
          </div>

          <LoansTable
            loans={loans}
            isLoading={loansActionStatus === 'loading'}
            totalLoans={totalLoans}
            limit={loansPerPage}
            offset={(currentPage - 1) * loansPerPage}
            onLimitChange={(value) => handlePerPageChange(String(value))}
            onOffsetChange={(newOffset) => setCurrentPage(Math.floor(newOffset / loansPerPage) + 1)}
            onQuickReturnAll={handleQuickReturnAll}
            onReturnSingleCopy={handleReturnSingleCopy}
            onLoanDelete={handleLoanDelete}
          />
        </div>
      ) : (
        <span></span>
      )}
    </div>
  );
}
