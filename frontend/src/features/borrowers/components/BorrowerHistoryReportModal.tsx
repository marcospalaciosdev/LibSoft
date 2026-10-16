import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { UpdateBorrowerDTO, MetricItem } from '@Libsoft/shared-types';

import { Modal, Button, Input } from '@/shared/components/ui';
import { firstCap } from '@/shared/utils/firstCap';

import { borrowersApi } from '../api/borrowers.api';
import { loansApi } from '../../loans/api/loans.api';
import { generateLoanSummaryMetricsObject } from '../../loans/utils/generateLoanSummaryMetricsObject';
import { generateBorrowerHistoryPDF } from '../utils/generateBorrowerHistoryPDF';

interface BorrowerHistoryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BorrowerHistoryReportModal({ isOpen, onClose }: BorrowerHistoryReportModalProps) {
  const { t, i18n } = useTranslation();
  const { id: borrowerId } = useParams<{ id: string }>();

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!borrowerId) return;

    if (startDate && endDate && startDate > endDate) {
      setError(firstCap(t('borrowers.historyReport.invalidRange', 'La fecha de inicio no puede ser posterior a la fecha de fin')));
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const rangeParams = {
        borrowerId,
        startDate: startDate || '',
        endDate: endDate || '',
      };

      const [borrower, loans, summaryMetrics] = await Promise.all([
        borrowersApi.getById(borrowerId) as Promise<UpdateBorrowerDTO>,
        loansApi.getAll({
          borrowerIds: [borrowerId],
          limit: 100000,
          offset: 0,
        }),
        loansApi.getLoanSummaryMetrics(rangeParams),
      ]);

      const metrics: MetricItem[] = generateLoanSummaryMetricsObject(summaryMetrics);
      const loanDetails = await Promise.all(
        loans.map((loan) => loansApi.getById(loan.id, i18n.language))
      );

      generateBorrowerHistoryPDF({
        borrower,
        loans,
        loanDetails,
        metrics,
        startDate: rangeParams.startDate,
        endDate: rangeParams.endDate,
        issuedAt: new Date().toISOString(),
        locale: i18n.language || 'es',
        translations: { t, firstCap },
      });

      onClose();
    } catch (err) {
      console.error('Error al generar el reporte histórico del socio:', err);
      setError(firstCap(t('borrowers.historyReport.generationError', 'Ocurrió un error al generar el reporte')));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (isGenerating) return;
    setStartDate('');
    setEndDate('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={firstCap(t('borrowers.historyReport.title', 'Exportar reporte histórico'))}
      subtitle={firstCap(t('borrowers.historyReport.subtitle', 'Seleccioná un rango de fechas o dejalo vacío para incluir todo el historial'))}
      maxWidth="sm"
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={firstCap(t('borrowers.historyReport.startDate', 'Desde'))}
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label={firstCap(t('borrowers.historyReport.endDate', 'Hasta'))}
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={handleClose} isDisabled={isGenerating}>
            {firstCap(t('common.cancel', 'Cancelar'))}
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            isLoading={isGenerating}
            leftIcon={<span className="material-symbols-outlined text-lg">download</span>}
          >
            {firstCap(t('borrowers.historyReport.download', 'Descargar PDF'))}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
