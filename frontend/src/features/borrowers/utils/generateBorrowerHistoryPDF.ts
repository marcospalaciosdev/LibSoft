import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Loan, LoanDetail, MetricItem, UpdateBorrowerDTO } from '@Libsoft/shared-types';
import type { TFunction } from 'i18next';

import { APP_NAME } from '@/shared/constants';

export interface BorrowerHistoryTranslations {
  t: TFunction;
  firstCap: (value: string) => string;
}

export interface BorrowerHistoryReportOptions {
  borrower: UpdateBorrowerDTO;
  loans: Loan[];
  loanDetails: LoanDetail[];
  metrics: MetricItem[];
  startDate?: string;
  endDate?: string;
  issuedAt?: string;
  locale?: string;
  translations: BorrowerHistoryTranslations;
}

const COLORS = {
  muted: [100, 116, 139] as [number, number, number],
  text: [51, 65, 85] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  headerBg: [30, 41, 59] as [number, number, number],
  rowAlt: [248, 250, 252] as [number, number, number],
  danger: [220, 38, 38] as [number, number, number],
  warning: [217, 119, 6] as [number, number, number],
  good: [5, 150, 105] as [number, number, number],
};

const formatDate = (value?: string, locale = 'es'): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone }).format(date);
};

const formatDateTime = (value?: string, locale = 'es'): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short', timeZone: localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone }).format(date);
};

export const generateBorrowerHistoryPDF = ({
  borrower,
  loanDetails,
  metrics,
  startDate,
  endDate,
  issuedAt,
  locale = 'es',
  translations,
}: BorrowerHistoryReportOptions): void => {
  const { t, firstCap } = translations;
  const translate = (key: string, fallback: string) =>
    firstCap(t(`borrowers.historyReport.${key}`, { defaultValue: fallback }));

  const borrowerName = `${borrower.firstName || ''} ${borrower.lastName || ''}`.trim() || '—';
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const marginX = 14;
  let cursorY = 0;
  const issuedAtLabel = formatDateTime(issuedAt || new Date().toISOString(), locale);

  const drawHeader = () => {
    pdf.setFillColor(...COLORS.headerBg);
    pdf.rect(0, 0, pageWidth, 24, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(APP_NAME, marginX, 15);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(translate('title', 'Reporte histórico de socio'), pageWidth - marginX, 15, { align: 'right' });
    cursorY = 34;
  };

  const drawFooter = () => {
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i += 1) {
      pdf.setPage(i);
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setDrawColor(...COLORS.border);
      pdf.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);
      pdf.setFontSize(8);
      pdf.setTextColor(...COLORS.muted);
      pdf.text(
        `${translate('generatedAt', 'Generado el')} ${formatDateTime(issuedAt || new Date().toISOString(), locale)}`,
        marginX,
        pageHeight - 8,
      );
      pdf.text(
        `${translate('page', 'Página')} ${i} ${translate('of', 'de')} ${pageCount}`,
        pageWidth - marginX,
        pageHeight - 8,
        { align: 'right' },
      );
    }
  };

  drawHeader();

  pdf.setTextColor(...COLORS.text);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(borrowerName, marginX, cursorY);
  cursorY += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.muted);
  const contactLine = [
    `${translate('dni', 'DNI')}: ${borrower.dni || '—'}`,
    borrower.email ? `${translate('email', 'Email')}: ${borrower.email}` : null,
    borrower.phone ? `${translate('phone', 'Teléfono')}: ${borrower.phone}` : null,
  ].filter(Boolean).join('   ·   ');
  pdf.text(contactLine, marginX, cursorY);
  cursorY += 5;

  const rangeLabel = startDate || endDate
    ? `${translate('period', 'Período')}: ${startDate ? formatDate(startDate, locale) : translate('start', 'Inicio')} — ${endDate ? formatDate(endDate, locale) : translate('today', 'Hoy')}`
    : translate('fullHistory', 'Historial completo');
  pdf.text(rangeLabel, marginX, cursorY);
  cursorY += 8;

  pdf.setTextColor(...COLORS.muted);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`${translate('issuedOn', 'Fecha y hora de emisión')}: ${issuedAtLabel}`, marginX, cursorY);
  cursorY += 8;

  const metricColumns = 3;
  const metricGap = 4;
  const metricWidth = (pageWidth - marginX * 2 - metricGap * (metricColumns - 1)) / metricColumns;
  const metricHeight = 18;

  metrics.forEach((metric, index) => {
    const col = index % metricColumns;
    const row = Math.floor(index / metricColumns);
    const x = marginX + col * (metricWidth + metricGap);
    const y = cursorY + row * (metricHeight + metricGap);

    pdf.setDrawColor(...COLORS.border);
    pdf.setFillColor(...COLORS.rowAlt);
    pdf.roundedRect(x, y, metricWidth, metricHeight, 2, 2, 'FD');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...COLORS.muted);
    pdf.text(firstCap(t(`loans.stats.${metric.metricKey}`, { defaultValue: metric.metricKey })), x + 4, y + 6, { maxWidth: metricWidth - 8 });

    const severityColorMap: Record<string, [number, number, number]> = {
      danger: COLORS.danger,
      warning: COLORS.warning,
      good: COLORS.good,
      normal: COLORS.text,
    };
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...(severityColorMap[metric.severity || 'normal'] || COLORS.text));
    const valueLabel = metric.valueType === 'percentage'
      ? `${metric.value ?? '--'}%`
      : String(metric.value ?? '--');
    pdf.text(valueLabel, x + 4, y + 14);
  });

  const metricRows = Math.ceil(metrics.length / metricColumns);
  cursorY += metricRows * (metricHeight + metricGap) + 4;

  const copyRows: (string | number)[][] = [];

  loanDetails.forEach((loan) => {
    const loanStatusLabel = firstCap(t(`common.statusValues.${loan.status}`, { defaultValue: loan.status }));

    if (!loan.items?.length) {
      copyRows.push([
        loan.id,
        translate('noCopies', 'Sin copias registradas'),
        '—',
        '—',
        loanStatusLabel,
      ]);
      return;
    }

    loan.items.forEach((item) => {
      const copies = item.copies && item.copies.length > 0 ? item.copies : [{ inventoryNumber: '—', returned: false, id: 0, returnDate: null }];
      copies.forEach((copy) => {
        copyRows.push([
          loan.id,
          item.title || '—',
          copy.inventoryNumber || '—',
          copy.returned ? translate('returned', 'Devuelta') : translate('pending', 'Prestada'),
          formatDateTime(copy.returnDate || undefined, locale),
        ]);
      });
    });
  });

  const detailHead = [[
    translate('loanId', 'Préstamo'),
    translate('bookTitle', 'Título'),
    translate('copy', 'Copia'),
    translate('copyStatus', 'Estado'),
    translate('returnedAt', 'Fecha de devolución'),
  ]];

  if (copyRows.length === 0) {
    copyRows.push(['—', translate('noLoans', 'No se registraron préstamos en el período seleccionado.'), '—', '—', '—']);
  }

  autoTable(pdf, {
    head: detailHead,
    body: copyRows,
    startY: cursorY,
    margin: { left: marginX, right: marginX, top: 30, bottom: 20 },
    tableWidth: 'auto',
    styles: {
      font: 'helvetica',
      fontSize: 7.8,
      textColor: COLORS.text,
      cellPadding: 2.5,
      overflow: 'linebreak'
    },
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.rowAlt },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 26 },
      3: { cellWidth: 22 },
      4: { cellWidth: 32 },
    },
    didDrawPage: () => {
      if (pdf.getCurrentPageInfo().pageNumber > 1) {
        drawHeader();
      }
    },
  });


  drawFooter();

  const safeName = borrowerName.replace(/\s+/g, '_').toLowerCase();
  pdf.save(`libsoft_historial_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
};
