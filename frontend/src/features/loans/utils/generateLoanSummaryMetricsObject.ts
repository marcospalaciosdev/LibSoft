import type {
  MetricItem,
  LoanSummaryMetrics
} from '@LibSoft/shared-types';

export function generateLoanSummaryMetricsObject(
  loanSummaryMetrics: LoanSummaryMetrics | undefined,
): MetricItem[] {

  const overdueCount = loanSummaryMetrics?.overdueLoans ?? 0;
  const overdueSeverity = overdueCount > 10 ? 'danger' : overdueCount > 7 ? 'warning' : 'normal';

  const dynamicMetrics: MetricItem[] = [
    {
      metricKey: 'active_loans',
      value: loanSummaryMetrics?.activeLoans, // <-- Corregido (era activeLoansCount)
      valueType: 'number',
      icon: 'book_2',
      severity: 'normal',
      className: 'px-5 bg-[rgb(var(--color-bg))] hover:bg-[rgb(var(--color-bg-secondary))] transition-colors',
    },
    {
      metricKey: 'returns_today',
      value: loanSummaryMetrics?.returnsToday, // <-- Corregido (era returnsTodayCount)
      valueType: 'number',
      icon: 'library_add_check',
      severity: 'normal',
      className: 'px-5 bg-[rgb(var(--color-bg))] hover:bg-[rgb(var(--color-bg-secondary))] transition-colors',
    },
    {
      metricKey: 'overdue_loans',
      value: loanSummaryMetrics?.overdueLoans, // <-- Correcto
      valueType: 'number',
      icon: overdueSeverity === 'danger' ? 'report_problem' : overdueSeverity === 'warning' ? 'warning' : 'running_with_errors',
      severity: overdueSeverity,
      className: 'px-5 bg-[rgb(var(--color-bg))] hover:bg-[rgb(var(--color-bg-secondary))] transition-colors',
    },
    {
      metricKey: 'soon_to_expire',
      value: loanSummaryMetrics?.dueSoonDomiciliaryLoans, // <-- Corregido (era dueSoonDomiciliaryCount)
      valueType: 'number',
      icon: 'access_time',
      severity: 'normal',
      className: 'px-5 bg-[rgb(var(--color-bg))] hover:bg-[rgb(var(--color-bg-secondary))] transition-colors',
    },
    {
      metricKey: 'total_loans',
      value: loanSummaryMetrics?.totalLoans, // <-- Corregido (era totalLoansCount)
      valueType: 'number',
      icon: 'stacked_line_chart',
      severity: 'normal',
      className: 'px-5 bg-[rgb(var(--color-bg))] hover:bg-[rgb(var(--color-bg-secondary))] transition-colors',
    },
    {
      metricKey: 'punctuality_rate',
      value: loanSummaryMetrics?.punctualityRate, // <-- Correcto
      valueType: 'percentage',
      icon: 'check_circle',
      severity: (loanSummaryMetrics?.punctualityRate ?? 100) < 80 ? 'warning' : 'good',
      className: 'px-5 bg-[rgb(var(--color-bg))] hover:bg-[rgb(var(--color-bg-secondary))] transition-colors',
    }
  ];
  return dynamicMetrics;
}