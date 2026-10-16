import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { LoanDetail } from '@LibSoft/shared-types';
import type { TFunction } from 'i18next';

export interface LoanReceiptTranslations {
  t: TFunction;
  firstCap: (value: string) => string;
}

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone
  }).format(date);
};

const createReceiptMarkup = (loan: LoanDetail, libraryProfile: any, translations: LoanReceiptTranslations): string => {
  const { t, firstCap } = translations;
  const translate = (key: string, fallback: string): string =>
    firstCap(t(`loans.loanReceipt.${key}`, { defaultValue: fallback }));
  const borrowerName = `${loan.borrower.firstName} ${loan.borrower.lastName}`.trim();
  const operatorName = `${loan.createdBy.firstName} ${loan.createdBy.lastName}`.trim();

  const rows = loan.items.flatMap((item) => item.copies.map((copy) => `
    <tr class="border-b border-slate-200">
      <td class="px-3 py-2 font-medium text-slate-800">${escapeHtml(item.title)}</td>
      <td class="px-3 py-2 text-slate-600">${escapeHtml(item.author)}</td>
      <td class="px-3 py-2 font-mono text-xs text-slate-600">${escapeHtml(copy.inventoryNumber)}</td>
      <td class="px-3 py-2 text-right font-semibold ${copy.returned ? 'text-emerald-700' : 'text-amber-700'}">${copy.returned ? translate('returned', 'Returned') : translate('pending', 'Pending')}</td>
    </tr>
  `)).join('');

  return `
    <article class="receipt-root">
      <header class="flex items-start justify-between border-b-2 border-slate-800 pb-6">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">${escapeHtml(libraryProfile.libraryName)}</h1>
          <p class="mt-1 text-xs text-slate-500">${escapeHtml(libraryProfile.address)}</p>
          <p class="text-xs text-slate-500">${escapeHtml(libraryProfile.primaryEmail)} · ${escapeHtml(libraryProfile.phoneNumber)}</p>
        </div>
        <div class="text-right">
          <p class="receipt-label">${translate('title', 'Loan receipt')}</p>
          <p class="receipt-number">#${escapeHtml(loan.id)}</p>
          <p class="receipt-muted">${translate('issuedAt', 'Issued')}: ${escapeHtml(formatDateTime(new Date().toISOString()))}</p>
        </div>
      </header>

      <section class="receipt-info-grid">
        <div class="receipt-card">
          <h2 class="receipt-card-title">${translate('borrower', 'Borrower')}</h2>
          <div class="receipt-data-grid">
            <div><span class="receipt-field-label">${translate('name', 'Name')}</span><strong>${escapeHtml(borrowerName)}</strong></div>
            <div><span class="receipt-field-label">${translate('dni', 'ID number')}</span><strong>${escapeHtml(loan.borrower.dni)}</strong></div>
            <div><span class="receipt-field-label">${translate('email', 'Email')}</span><strong>${escapeHtml(loan.borrower.email || translate('noData', 'Not provided'))}</strong></div>
            <div><span class="receipt-field-label">${translate('phone', 'Phone')}</span><strong>${escapeHtml(loan.borrower.phone || translate('noData', 'Not provided'))}</strong></div>
          </div>
        </div>
        <div class="receipt-card">
          <h2 class="receipt-card-title">${translate('schedule', 'Loan schedule')}</h2>
          <div class="receipt-schedule">
            <div><span class="receipt-field-label">${translate('loanDate', 'Loan date')}</span><strong>${escapeHtml(formatDateTime(loan.loanDate))}</strong></div>
            <div><span class="receipt-field-label">${translate('dueDate', 'Due date')}</span><strong>${escapeHtml(formatDateTime(loan.dueDate))}</strong></div>
            <div><span class="receipt-field-label">${translate('type', 'Loan type')}</span><strong>${escapeHtml(firstCap(t(`loans.addModal.${loan.type}`, { defaultValue: loan.type })))}</strong></div>
            <div><span class="receipt-field-label">${translate('status', 'Status')}</span><strong>${escapeHtml(firstCap(t(`common.statusValues.${loan.status}`, { defaultValue: loan.status })))}</strong></div>
          </div>
        </div>
      </section>

      <section class="receipt-materials">
        <div class="receipt-section-heading">
          <h2 class="receipt-section-title">${translate('materials', 'Borrowed materials')}</h2>
          <span class="receipt-count">${loan.items.length} ${translate('titles', 'titles')}</span>
        </div>
        <table class="receipt-table">
          <thead><tr><th>${translate('bookTitle', 'Title')}</th><th>${translate('author', 'Author')}</th><th>${translate('inventory', 'Inventory')}</th><th class="text-right">${translate('copyStatus', 'Status')}</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </section>

      <section class="receipt-operator">
        <span class="receipt-field-label">${translate('registeredBy', 'Registered by')}</span>
        <strong>${escapeHtml(operatorName)}</strong>
        <span>${escapeHtml(loan.createdBy.username)} · ${escapeHtml(loan.createdBy.email)}</span>
      </section>

      <footer class="receipt-footer">
        <div class="receipt-signature">${translate('borrowerSignature', 'Borrower signature')}</div>
        <div class="receipt-signature">${translate('librarianSignature', 'Librarian signature')}</div>
      </footer>
    </article>
  `;
};

const receiptPdfStyles = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, sans-serif; }
  .receipt-root { width: 794px; min-height: 1123px; background: #fff; padding: 44px 48px; color: #334155; font-size: 13px; }
  .receipt-root header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e293b; padding-bottom: 24px; }
  .receipt-root h1 { margin: 0; color: #0f172a; font-size: 24px; line-height: 1.2; }
  .receipt-root p { margin: 4px 0 0; }
  .receipt-muted { color: #64748b; font-size: 12px; }
  .receipt-label { color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
  .receipt-number { margin-top: 5px; color: #0f172a; font-size: 20px; font-weight: 700; }
  .receipt-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 28px; }
  .receipt-card { border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; padding: 16px; }
  .receipt-card-title { margin: 0 0 14px; color: #0f172a; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .receipt-data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 18px; }
  .receipt-data-grid div, .receipt-schedule div { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .receipt-field-label { color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; }
  .receipt-data-grid strong, .receipt-schedule strong { overflow-wrap: anywhere; color: #1e293b; font-size: 12px; }
  .receipt-schedule { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 18px; }
  .receipt-materials { margin-top: 30px; }
  .receipt-section-heading { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 12px; }
  .receipt-section-title { margin: 0; color: #0f172a; font-size: 14px; font-weight: 700; }
  .receipt-count { color: #64748b; font-size: 11px; }
  .receipt-table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; font-size: 12px; text-align: left; }
  .receipt-table th { padding: 8px 12px; background: #1e293b; color: #fff; }
  .receipt-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
  .receipt-operator { display: flex; flex-direction: column; gap: 4px; margin-top: 28px; border-left: 3px solid #1e293b; background: #f8fafc; padding: 12px 16px; }
  .receipt-operator strong { color: #0f172a; font-size: 13px; }
  .receipt-operator span:last-child { color: #64748b; font-size: 12px; }
  .receipt-footer { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; margin-top: 86px; color: #64748b; text-align: center; font-size: 11px; }
  .receipt-signature { border-top: 1px solid #94a3b8; padding-top: 8px; }
`;

export const generateLoanReceiptPDF = async (
  loan: LoanDetail,
  libraryProfile: any,
  translations: LoanReceiptTranslations,
): Promise<void> => {
  const container = document.createElement('div');
  container.className = 'fixed -left-[10000px] top-0';
  container.innerHTML = createReceiptMarkup(loan, libraryProfile, translations);
  const style = document.createElement('style');
  style.textContent = receiptPdfStyles;
  container.appendChild(style);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      onclone: (clonedDocument) => {
        clonedDocument.querySelectorAll('style, link[rel="stylesheet"]').forEach((element) => {
          element.remove();
        });

        const clonedStyle = clonedDocument.createElement('style');
        clonedStyle.textContent = receiptPdfStyles;
        clonedDocument.head.appendChild(clonedStyle);
      },
    });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageWidth = pageWidth - 20;
    const imageHeight = (canvas.height * imageWidth) / canvas.width;
    const imageData = canvas.toDataURL('image/png');

    let offset = 0;
    while (offset < imageHeight) {
      if (offset > 0) pdf.addPage();
      pdf.addImage(imageData, 'PNG', 10, 10 - offset, imageWidth, imageHeight);
      offset += pageHeight - 20;
    }

    pdf.save(`libsoft_receipt_${loan.id}.pdf`);
  } finally {
    container.remove();
  }
};
