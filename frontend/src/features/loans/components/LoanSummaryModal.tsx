import { Badge, Button, Modal } from "@/shared/components/ui";
import { formatDateShort, formatDateTime } from "@/shared/utils";
import type { LoanDetail } from "@LibSoft/shared-types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateLoanReceiptPDF } from "../utils/generateLoanReceiptPDF";
import { useTranslation } from 'react-i18next';
import { firstCap } from '@/shared/utils/firstCap';

type LoanSummaryModalProps = {
    loan: LoanDetail;
    isOpen: boolean;
    onClose: () => void;
}

export function LoanSummaryModal({
    loan,
    isOpen,
    onClose
}: LoanSummaryModalProps) {

    const navigate = useNavigate();
    const { t } = useTranslation();

    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

    const toggleItem = (index: number) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="lg"
            className=""
        >
            <div>
                <div className="flex flex-col gap-2 p-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] text-(length:--fs-icon-lg) bg-[rgb(var(--color-primary-500))]/20 p-3 rounded-md ">
                            check_circle
                        </span>
                        <span className="font-semibold text-(length:--fs-body-lg) text-[rgb(var(--color-text))]">
                            Prestamo Registrado con Exito!
                        </span>
                        <span className="text-[rgb(var(--color-text-muted))] text-center text-(length:--fs-caption) max-w-80">
                            La transaccion se ha completado correctamente en el sistema. Los libros han sido asignados al prestatario.
                        </span>
                    </div>
                    <div className="flex w-full items-center justify-between gap-2 mt-6">
                        <div className="w-[50%] h-32 rounded-md relative overflow-hidden">
                            <div className="h-full w-full inset-0 bg-[rgb(var(--color-primary-500))] absolute"></div>
                            <div className="h-full w-full flex flex-col justify-between inset-0 left-0.75 rounded-md bg-[rgb(var(--color-surface))] absolute px-4 py-4">
                                <span className="uppercase tracking-wider font-bold text-[rgb(var(--color-text-muted))] text-[length:--fs-caption-xs]">
                                    Datos del prestatario
                                </span>
                                <div className="flex flex-col mt-2 gap-0.5">
                                    <span className="text-(length:--fs-body) text-nowrap text-[rgb(var(--color-text))] capitalize  font-semibold">
                                        {loan?.borrower.firstName} {loan?.borrower.lastName}
                                    </span>
                                    <span className="text-(length:--fs-caption-sm) text-[rgb(var(--color-text-muted))]">
                                        DNI: {loan?.borrower.dni}
                                    </span>
                                    <Badge
                                        variant="info"
                                        className="text-(length:--fs-caption-sm) w-fit"
                                    >
                                        {loan?.borrower.email}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="h-32 w-[50%] bg-[rgb(var(--color-surface))] rounded-md px-4 py-2">
                            <span className="uppercase tracking-wider font-bold text-[rgb(var(--color-text-muted))] text-[length:--fs-caption-xs]">
                                Cronograma
                            </span>
                            <div className="flex flex-col gap-1 mt-2">
                                <div>
                                    <span className="block text-(length:--fs-caption-sm) text-[rgb(var(--color-text-muted))]">
                                        Fecha de prestamo:
                                    </span>
                                    <span className="block text-(length:--fs-caption-sm) font-semibold text-[rgb(var(--color-text))]">
                                        {formatDateShort(loan?.loanDate || '')} - {formatDateTime(loan?.loanDate || '')}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-(length:--fs-caption-sm) text-[rgb(var(--color-text-muted))]">
                                        Fecha de devolucion:
                                    </span>
                                    <span className="block text-(length:--fs-caption-sm) font-semibold text-[rgb(var(--color-primary-700))]">
                                        {formatDateShort(loan?.dueDate || '')} - {formatDateTime(loan?.dueDate || '')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full mt-3">
                        <div className="w-full">
                            <div className="flex w-full items-center justify-between">
                                <span className="uppercase font-semibold text-[length:--fs-caption-xs] text-[rgb(var(--color-text-muted))]">
                                    Materiales Retirados
                                </span>
                                <span className="uppercase font-semibold text-[length:--fs-caption-xs] text-[rgb(var(--color-text-muted))]">
                                    {loan?.items.length} Titulos
                                </span>
                            </div>
                        </div>
                        <div className="w-full mt-2 border border-[rgb(var(--color-border))] overflow-y-auto max-h-50 rounded-md">
                            <div className="sticky top-0 z-10 flex justify-between px-4 py-2 bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))]">
                                <span className="text-[length:--fs-caption-xs] text-[rgb(var(--color-text-muted))] font-semibold uppercase">
                                    Titulo
                                </span>
                                <span className="text-[length:--fs-caption-xs] text-[rgb(var(--color-text-muted))] font-semibold uppercase">
                                    Unidades
                                </span>
                            </div>
                            {loan?.items.map((item, index) => {
                                const isExpanded = expandedItems.has(index);
                                return (
                                    <div key={index} className={index !== loan?.items.length - 1 ? 'border-b border-[rgb(var(--color-border))]' : ''}>
                                        <div
                                            onClick={() => toggleItem(index)}
                                            className="flex items-center justify-between gap-2 pl-5 pr-3 py-3 cursor-pointer hover:bg-[rgb(var(--color-bg-hover))]/30 transition-colors duration-150 select-none"
                                        >
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-(length:--fs-caption) font-semibold text-[rgb(var(--color-text))] truncate">
                                                    {item.title}
                                                </span>
                                                <span className="text-[length:--fs-caption-xs] text-[rgb(var(--color-text-muted))]">
                                                    {item.author}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="bg-[rgb(var(--color-primary-500))]/10 text-[rgb(var(--color-primary-500))] text-[length:--fs-caption-xs] font-bold px-2 py-0.5 rounded-full">
                                                    {item.copies.length} {item.copies.length === 1 ? 'copia' : 'copias'}
                                                </span>
                                                <span className={`material-symbols-outlined text-[14px] text-[rgb(var(--color-text-muted))] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                                    expand_more
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="flex flex-wrap gap-1.5 px-5 pt-3 pb-3">
                                                {item.copies.map((copy) => (
                                                    <div key={copy.id} className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))]/60 flex items-center gap-1 px-2 py-1 rounded-sm">
                                                        <span className="material-symbols-outlined text-[10px] text-[rgb(var(--color-text-muted))]">inventory_2</span>
                                                        <span className="text-[length:--fs-caption-xs] font-semibold text-[rgb(var(--color-text))] uppercase">
                                                            {copy.inventoryNumber}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="w-full bg-[rgb(var(--color-bg-secondary))] border-t border-[rgb(var(--color-border))] flex p-4 gap-4">
                    <Button
                        variant="ghost"
                        className="w-[50%] rounded-sm text-[rgb(var(--color-text))]!"
                        onClick={() => { navigate('/loans'); }}
                    >
                        <span className="text-(length:--fs-caption)">
                            Finalizar y Salir
                        </span>
                    </Button>
                    <Button
                        variant="primary"
                        className="w-[50%] rounded-sm bg-[rgb(var(--color-primary-500))] hover:bg-[rgb(var(--color-primary-600))] py-3 group"
                        onClick={() => {
                            void generateLoanReceiptPDF(loan, {}, { t, firstCap });
                        }}
                        leftIcon={
                            <span className="material-symbols-outlined text-white">
                                download
                            </span>
                        }
                    >
                        <span className="text-(length:--fs-caption)">Descargar Comprobante</span>
                    </Button>
                </div>
            </div>
        </Modal>
    )
}