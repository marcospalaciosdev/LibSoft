import { useTranslation } from 'react-i18next';
import { Button, PaginationFooter, Spinner } from '@/shared/components/ui';
import { firstCap } from '@/shared/utils/firstCap';
import { TableLoanRow } from '../TableLoanRow';

import type { Loan } from '@LibSoft/shared-types';

interface LoansTableProps {
  loans: Loan[];
  isLoading: boolean;
  totalLoans: number;
  limit: number;
  offset: number;
  onLimitChange: (limit: number) => void;
  onOffsetChange: (offset: number) => void;
  onQuickReturnAll: (e: React.MouseEvent, loanId: string) => Promise<void>;
  onReturnSingleCopy: (loanId: string, copyId: number) => Promise<void>;
  onLoanDelete: (loanId: string) => Promise<void>;
  onCleanFilters?: () => void;
  className?: string;
}

export function LoansTable({
  loans,
  isLoading,
  totalLoans,
  limit,
  offset,
  onLimitChange,
  onOffsetChange,
  onQuickReturnAll,
  onReturnSingleCopy,
  onLoanDelete,
  onCleanFilters,
  className
}: LoansTableProps) {
  const { t } = useTranslation();

  return (
    <div className={`bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))]/60 rounded-xl overflow-hidden flex flex-col relative ${className || ''}`}>
      <div className="w-full overflow-x-auto flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-24">
            <Spinner size="lg" />
          </div>
        ) : (
          <table className="w-full min-w-250 flex-1 border-collapse text-left">
            <thead className='sticky top-0 bg-[rgb(var(--color-bg))]'>
              <tr className="bg-[rgb(var(--color-bg-secondary))]/50 border-b border-[rgb(var(--color-border))]">
                <th className="w-12 py-4 px-4 text-center"></th>
                <th className="py-4 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider w-40">
                  {firstCap(t('common.books'))}
                </th>
                <th className="py-4 px-4.5 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider min-w-40">
                  {firstCap(t('common.roles.borrower'))}
                </th>
                <th className="py-4 px-4.5 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider min-w-40">
                  {firstCap(t('common.roles.user'))}
                </th>
                <th className="py-4 text-xs w-30 font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider">
                  {firstCap(t('common.date'))}
                </th>
                <th className="py-4 text-xs w-30 font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider">
                  {firstCap(t('common.ending'))}
                </th>
                <th className="py-4 text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider w-25 text-center">
                  {firstCap(t('common.status'))}
                </th>
                <th className="py-4 px-4 text-right text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-wider">
                  {firstCap(t('common.actions.actions'))}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--color-border))]/50">
              {loans.map((loan) => (
                <TableLoanRow
                  key={loan.id}
                  loan={loan}
                  handleQuickReturnAll={onQuickReturnAll}
                  handleReturnSingleCopy={onReturnSingleCopy}
                  handleLoanDelete={onLoanDelete}
                />
              ))}

              {loans.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                      <div className="w-16 h-16 bg-[rgb(var(--color-text-muted))]/5 border border-[rgb(var(--color-border))]/40 rounded-full flex items-center justify-center mb-4 text-[rgb(var(--color-text-muted))]/30 transition-transform hover:scale-105">
                        <span className="material-symbols-outlined text-4xl">inventory</span>
                      </div>
                      <p className="text-[rgb(var(--color-text-muted))]/80 text-sm font-semibold uppercase tracking-wider">
                        {firstCap(t('loans.noLoansRegistered'))}
                      </p>
                      <p className="text-[rgb(var(--color-text-muted))]/60 text-xs mt-1 mb-5">
                        {firstCap(t('loans.changeSearchCriteria'))}
                      </p>
                      {onCleanFilters && (
                        <Button
                          onClick={onCleanFilters}
                          variant="ghost"
                          className="border border-[rgb(var(--color-border))] text-xs font-bold rounded-md px-4 py-2 hover:bg-[rgb(var(--color-bg-secondary))]/60"
                        >
                          {firstCap(t('common.actions.cleanFilters'))}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {loans.length > 0 &&
        <PaginationFooter
          limit={limit}
          limitOptions={[10, 20, 50, 100]}
          offset={offset}
          totalItems={totalLoans}
          onLimitChange={onLimitChange}
          onPageChange={onOffsetChange}
          resultsCountText={(visible, total) => `${visible} / ${total}`}
          resultsPerPageLabel={<span className="text-(length:--fs-caption) text-[rgb(var(--color-text-muted))]">{firstCap(t('common.resultsPerPage'))}</span>}
        />
      }
    </div>
  );
}
