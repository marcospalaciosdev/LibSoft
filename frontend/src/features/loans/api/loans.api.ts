import { httpClient } from '@/shared/services/http';

import type {
  Loan,
  LoanDetail,
  CreateLoanDTO,
  ReturnMetricsByMonth,
  LoanSummaryMetrics,
  GetLoanSummaryMetricsParams,
  GetLoansParams,
} from '@Libsoft/shared-types';

export function mapLoansData(data: any) {
  const loans = data.map((l: any) => ({
    id: l.id,
    booksTitle: l.book_title,
    borrowerId: l.borrower_id ?? '',
    borrowerName: l.borrower_name,
    loanDate: l.loan_date,
    dueDate: l.due_date,
    returnDate: l.return_date || undefined,
    status: l.status as 'active' | 'overdue' | 'returned',
    type: l.type || undefined,
    createdAt: l.created_at || l.loan_date
  }));

  return loans;
}

const serializeParams = (params: Record<string, any>): Record<string, string> => {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = String(value);
    }
    return acc;
  }, {} as Record<string, string>);
};

export const loansApi = {
  getAll: (params?: GetLoansParams) =>
    httpClient.get<Loan[]>(`/loans`, { params }),

  getAmount: () =>
    httpClient.get<{ total: number }>('/loans/count'),

  getById: (id: string, lang?: string) =>
    httpClient.get<LoanDetail>(`/loans/${id}`, {
      headers: {
        'Accept-Language': lang || 'en'
      }
    }),

  create: (data: CreateLoanDTO) => httpClient.post<LoanDetail>('/loans', data),

  returnBook: (id: string, copies?: number[] | { copyId: number; returned: boolean; returnDate: string | null }[]) => {
    const payload = copies && copies.length > 0 && typeof copies[0] === 'number'
      ? { copyIds: copies }
      : { copies };
    return httpClient.patch<Loan>(`/loans/${id}/return`, payload);
  },

  delete: (id: string) => httpClient.delete(`/loans/${id}`),

  getReturnMetricsByMonth: (monthsBack?: number) =>
    httpClient.get<ReturnMetricsByMonth[]>('/loans/metrics/returns-by-month', { params: monthsBack ? { monthsBack: String(monthsBack) } : {} }),

  getLoanSummaryMetrics: (params?: GetLoanSummaryMetricsParams) =>
    httpClient.get<LoanSummaryMetrics>('/loans/metrics/summary', { params: params ? serializeParams(params) : undefined }),
};
