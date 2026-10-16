import { useState, Fragment, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/shared/utils/formatDate';
import { firstCap } from '@/shared/utils/firstCap';
import { Button, Badge, Spinner } from '@/shared/components/ui';
import { loansApi } from '../api/loans.api';
import i18n from '@/locales/i18n';

import type { Loan, LoanDetail } from '@LibSoft/shared-types';
import { generateLoanReceiptPDF } from '../utils/generateLoanReceiptPDF';
import { useOutsideClick } from '@/shared/hooks/useOutsideClick';
import { metadataApi } from '@/features/auth/metadata/metadata.api';

const statusVariant = {
    active: 'success' as const,
    overdue: 'error' as const,
    returned: 'default' as const,
};

interface TableLoanRowProps {
    loan: Loan;
    handleQuickReturnAll?: (e: React.MouseEvent, loanId: string) => Promise<void>;
    handleReturnSingleCopy?: (loanId: string, copyId: number) => Promise<void>;
    handleLoanDelete?: (loanId: string) => Promise<void>;
}

export function TableLoanRow({
    loan,
    handleQuickReturnAll,
    handleReturnSingleCopy,
    handleLoanDelete,
}: TableLoanRowProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [isExpanded, setIsExpanded] = useState(false);
    const [details, setDetails] = useState<LoanDetail | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [generatingReceipt, setGeneratingReceipt] = useState(false);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuTriggerRef = useRef<HTMLButtonElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; transformOrigin: string } | null>(null);

    const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>({});

    useOutsideClick([menuRef, menuTriggerRef], () => setIsMenuOpen(false));

    const updateMenuPosition = useCallback(() => {
        const triggerElement = menuTriggerRef.current;
        if (!triggerElement) return;

        const triggerRect = triggerElement.getBoundingClientRect();
        const menuWidth = menuRef.current?.offsetWidth ?? 208;
        const menuHeight = menuRef.current?.offsetHeight ?? 0;
        const viewportPadding = 8;
        const offset = 4;

        const clampedLeft = Math.min(
            Math.max(triggerRect.right - menuWidth, viewportPadding),
            window.innerWidth - menuWidth - viewportPadding,
        );

        const shouldOpenUp =
            menuHeight > 0 &&
            triggerRect.bottom + offset + menuHeight > window.innerHeight - viewportPadding &&
            triggerRect.top - offset - menuHeight >= viewportPadding;

        const top = shouldOpenUp
            ? Math.max(viewportPadding, triggerRect.top - menuHeight - offset)
            : Math.min(
                triggerRect.bottom + offset,
                Math.max(viewportPadding, window.innerHeight - menuHeight - viewportPadding),
            );

        setMenuPosition({
            top,
            left: clampedLeft,
            transformOrigin: shouldOpenUp ? 'bottom right' : 'top right',
        });
    }, []);

    useEffect(() => {
        if (!isMenuOpen) {
            setMenuPosition(null);
            return;
        }

        const frameId = window.requestAnimationFrame(() => {
            updateMenuPosition();
        });

        const handleViewportChange = () => {
            updateMenuPosition();
        };

        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('scroll', handleViewportChange, true);

        return () => {
            window.cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('scroll', handleViewportChange, true);
        };
    }, [isMenuOpen, updateMenuPosition]);

    const generateSummary = async (event?: React.MouseEvent) => {
        event?.stopPropagation();
        if (generatingReceipt) return;

        setGeneratingReceipt(true);
        try {
            const response = await loansApi.getById(loan.id, i18n.language);
            const detailedLoan = (response as any).data || response;
            const libraryProfile = await metadataApi.getLibraryProfile();
            setDetails(detailedLoan);
            await generateLoanReceiptPDF(detailedLoan, libraryProfile, { t, firstCap });
        } catch (error) {
            console.error(error);
            window.alert('No se pudo generar el comprobante del préstamo.');
        } finally {
            setGeneratingReceipt(false);
        }
    };

    const toggleRow = async () => {
        const nextExpandedState = !isExpanded;
        setIsExpanded(nextExpandedState);

        if (nextExpandedState && !details) {
            setLoadingDetails(true);
            try {
                const response = await loansApi.getById(loan.id, i18n.language);
                const detailedLoan = (response as any).data || response;
                setDetails(detailedLoan);
            } catch (error) {
                console.error(`Error loading loan details for ID ${loan.id}:`, error);
            } finally {
                setLoadingDetails(false);
            }
        }
    };

    const refreshDetails = async () => {
        setLoadingDetails(true);
        try {
            const response = await loansApi.getById(loan.id, i18n.language);
            const detailedLoan = (response as any).data || response;
            setDetails(detailedLoan);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const toggleBookExpansion = (bookKey: string) => {
        setExpandedBooks(prev => ({
            ...prev,
            [bookKey]: !prev[bookKey]
        }));
    };

    const onReturnSingleCopy = async (copyId: number) => {
        if (handleReturnSingleCopy) await handleReturnSingleCopy(loan.id, copyId);

        try {
            const response = await loansApi.getById(loan.id);
            const detailedLoan = (response as any).data || response;
            setDetails(detailedLoan);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAction = (action: string) => {
        setIsMenuOpen(false);
        switch (action) {
            case 'download':
                void generateSummary();
                break;
            case 'quick-return':
                if (handleQuickReturnAll) {
                    void handleQuickReturnAll({ stopPropagation: () => undefined } as React.MouseEvent, loan.id);
                }
                break;
            case 'return':
                navigate(`/loans/return/${loan.id}`);
                break;
            case 'delete':
                if (handleLoanDelete) void handleLoanDelete(loan.id);
                break;
            case 'details':
                void toggleRow();
                break;
        }
    };

    return (
        <Fragment>
            <tr
                className={`even:bg-[rgb(var(--color-tab-even))] hover:bg-[rgb(var(--color-bg-secondary))]/25 transition-all duration-150 cursor-pointer group ${isExpanded ? 'bg-[rgb(var(--color-bg-secondary))]/15' : ''
                    }`}
                onClick={toggleRow}
            >
                <td className="py-4 text-center align-middle">
                    <span
                        className={`material-symbols-outlined text-[rgb(var(--color-text-muted))]/60 select-none transition-transform duration-200 ${isExpanded ? 'rotate-90 text-[rgb(var(--color-primary-500))]' : ''
                            }`}
                    >
                        chevron_right
                    </span>
                </td>

                <td className="pr-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-[rgb(var(--color-primary-500))]/10 border border-[rgb(var(--color-primary-500))]/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] text-lg">
                                menu_book
                            </span>
                        </div>
                        <span className="font-semibold text-sm text-[rgb(var(--color-text))] w-62.5 truncate leading-tight">
                            {loan.booksTitle || '--'}
                        </span>
                    </div>
                </td>

                <td className="text-sm font-medium text-[rgb(var(--color-text))] pr-3">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-[rgb(var(--color-text-muted))]/60 text-nowrap">
                            person
                        </span>
                        <span className="text-sm text-[rgb(var(--color-text-muted))] truncate leading-tight">
                            {loan.borrowerName}
                        </span>
                    </div>
                </td>

                <td className="text-sm font-medium text-[rgb(var(--color-text))] pr-3">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-[rgb(var(--color-text-muted))]/60 text-nowrap">
                            person
                        </span>
                        <span className="text-sm text-[rgb(var(--color-text-muted))] truncate leading-tight">
                            {loan.user.firstName} {loan.user.lastName}
                        </span>
                    </div>
                </td>

                <td className="text-sm text-[rgb(var(--color-text-muted))]">
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs text-[rgb(var(--color-text-muted))]/40">
                            calendar_today
                        </span>
                        <span>{formatDate(loan.loanDate)}</span>
                    </div>
                </td>

                <td className="text-sm text-[rgb(var(--color-text-muted))]">
                    <div className="flex items-center gap-1.5 font-medium">
                        <span className="material-symbols-outlined text-xs text-[rgb(var(--color-text-muted))]/40">
                            event
                        </span>
                        <span
                            className={
                                loan.status === 'overdue'
                                    ? 'text-[rgb(var(--color-error-500))] font-semibold'
                                    : ''
                            }
                        >
                            {formatDate(loan.dueDate)}
                        </span>
                    </div>
                </td>

                <td className="text-center">
                    <Badge
                        variant={statusVariant[loan.status]}
                        className="px-2.5 py-1 text-xs rounded-md font-semibold border"
                    >
                        {firstCap(t(`common.statusValues.${loan.status}`))}
                    </Badge>
                </td>

                {/* MENÚ DE ACCIONES PROPIO (SIN DropDownMenu) */}
                <td className="text-right align-middle pr-4" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-block text-left">
                        <button
                            ref={menuTriggerRef}
                            type="button"
                            onClick={() => setIsMenuOpen((prev) => !prev)}
                            className="w-8 h-8 rounded-md flex items-center justify-center text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg-secondary))]/50 transition-colors focus:outline-none"
                        >
                            <span className="material-symbols-outlined text-lg">
                                more_vert
                            </span>
                        </button>

                        {isMenuOpen && typeof document !== 'undefined' && createPortal(
                            <div
                                ref={menuRef}
                                className="fixed w-52 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] shadow-xl z-[9999] text-xs animate-[fadeIn_100ms_ease-out] overflow-hidden"
                                style={{
                                    top: menuPosition?.top ?? 0,
                                    left: menuPosition?.left ?? 0,
                                    visibility: menuPosition ? 'visible' : 'hidden',
                                    transformOrigin: menuPosition?.transformOrigin ?? 'top right',
                                }}
                            >
                                <Button
                                    variant='default'
                                    onClick={() => handleAction('details')}
                                    className="rounded-none w-full justify-start! text-left px-3.5 py-2 flex items-center gap-2.5 font-medium text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg-secondary))]/40 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-base text-[rgb(var(--color-primary-500))]">
                                        visibility
                                    </span>
                                    <span className="text-(length:--fs-caption)">{firstCap(t('loans.loanDetails', { defaultValue: 'Detalles del préstamo' }))}</span>
                                </Button>

                                <Button
                                    variant='default'
                                    onClick={() => handleAction('download')}
                                    className="rounded-none w-full justify-start! text-left px-3.5 py-2 flex items-center gap-2.5 font-medium text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg-secondary))]/40 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-base text-[rgb(var(--color-text-muted))]">
                                        description
                                    </span>
                                    <span className="text-(length:--fs-caption)">{firstCap(t('loans.actions.downloadReceipt', { defaultValue: 'Descargar comprobante' }))}</span>
                                </Button>

                                {loan.status !== 'returned' && handleQuickReturnAll && (
                                    <Button
                                        variant='default'
                                        onClick={() => handleAction('quick-return')}
                                        className="rounded-none w-full justify-start! text-left px-3.5 py-2 flex items-center gap-2.5 font-medium text-[rgb(var(--color-success-500))] hover:bg-[rgb(var(--color-success-500))]/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-base">
                                            bolt
                                        </span>
                                        <span className="text-(length:--fs-caption)">{firstCap(t('loans.quickReturn', { defaultValue: 'Devolución rápida' }))}</span>
                                    </Button>
                                )}

                                {loan.status !== 'returned' && (
                                    <Button
                                        variant='default'
                                        onClick={() => handleAction('return')}
                                        className="rounded-none w-full justify-start! text-left px-3.5 py-2 flex items-center gap-2.5 font-medium text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg-secondary))]/40 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-base text-[rgb(var(--color-text-muted))]">
                                            assignment_return
                                        </span>
                                        <span className="text-(length:--fs-caption)">{firstCap(t('loans.handleReturnPage.title', { defaultValue: 'Gestionar devolución' }))}</span>
                                    </Button>
                                )}

                                {handleLoanDelete && (
                                    <div className="border-t border-[rgb(var(--color-border))]/50">
                                        <Button
                                            variant='default'
                                            onClick={() => handleAction('delete')}
                                            className="rounded-none w-full justify-start! text-left px-3.5 py-2 flex items-center gap-2.5 font-medium text-[rgb(var(--color-error-500))] hover:bg-[rgb(var(--color-error-500))]/10 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-base">
                                                delete
                                            </span>
                                            <span className="text-(length:--fs-caption)">{firstCap(t('loans.deleteLoan', { defaultValue: 'Eliminar préstamo' }))}</span>
                                        </Button>
                                    </div>
                                )}
                            </div>,
                            document.body,
                        )}
                    </div>
                </td>
            </tr>

            {isExpanded && (
                <tr>
                    <td colSpan={8} className="p-0 bg-[rgb(var(--color-bg-secondary))]/10">
                        <div className="px-8 py-5 border-l-2 border-[rgb(var(--color-primary-500))] animate-[fadeIn_200ms_ease-out]">
                            {loadingDetails ? (
                                <div className="flex py-6 justify-center items-center gap-2">
                                    <Spinner size="sm" />
                                    <span className="text-xs text-[rgb(var(--color-text-muted))]/60 font-semibold uppercase tracking-wider">
                                        {firstCap(t('books.loadingUnitBreakdown'))}...
                                    </span>
                                </div>
                            ) : details ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-[rgb(var(--color-border))]/50">
                                        <h3 className="text-xs font-bold text-[rgb(var(--color-text-muted))]/80 uppercase tracking-widest flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm text-[rgb(var(--color-primary-500))]">
                                                inventory_2
                                            </span>
                                            LIBROS ASOCIADOS AL PRÉSTAMO (Haga clic para desplegar unidades)
                                        </h3>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {details.items.map((groupedBook) => {
                                            const bookKey = `${groupedBook.title}-${groupedBook.author}`;
                                            const isBookExpanded = !!expandedBooks[bookKey];
                                            const pendingCopies = groupedBook.copies.filter(c => !c.returned).length;

                                            return (
                                                <div
                                                    key={bookKey}
                                                    className="border border-[rgb(var(--color-border))]/60 rounded-lg overflow-hidden bg-[rgb(var(--color-bg))] transition-all"
                                                >
                                                    <div
                                                        onClick={() => toggleBookExpansion(bookKey)}
                                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 cursor-pointer hover:bg-[rgb(var(--color-bg-secondary))]/30 transition-colors select-none"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className={`material-symbols-outlined text-[rgb(var(--color-text-muted))]/60 transition-transform duration-200 ${isBookExpanded ? 'rotate-90 text-[rgb(var(--color-primary-500))]' : ''}`}>
                                                                chevron_right
                                                            </span>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm text-[rgb(var(--color-text))]">
                                                                    {groupedBook.title}
                                                                </span>
                                                                <span className="text-xs text-[rgb(var(--color-text-muted))]">
                                                                    {groupedBook.author} · {groupedBook.category ? firstCap(groupedBook.category) : '---'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 mt-2 sm:mt-0 pl-7 sm:pl-0">
                                                            <span className="text-xs font-semibold text-[rgb(var(--color-text-muted))]">
                                                                {firstCap(t('books.copies', { count: groupedBook.copies.length }))}
                                                            </span>
                                                            {pendingCopies > 0 ? (
                                                                <Badge variant="error" className="px-2 py-0.5 text-[10px] rounded font-bold">
                                                                    {firstCap(t('loans.TableLoanRow.notReturned', { count: pendingCopies }))}
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="success" className="px-2 py-0.5 text-[10px] rounded font-bold">
                                                                    {firstCap(t('loans.TableLoanRow.allReturned'))}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {isBookExpanded && (
                                                        <div className="border-t border-[rgb(var(--color-border))]/40 bg-[rgb(var(--color-bg-secondary))]/10 animate-[fadeIn_150ms_ease-out]">
                                                            <table className="w-full text-left text-xs border-collapse">
                                                                <thead>
                                                                    <tr className="bg-[rgb(var(--color-bg-secondary))]/30 border-b border-[rgb(var(--color-border))]/40 text-[rgb(var(--color-text-muted))]/70">
                                                                        <th className="py-2 px-4 font-bold uppercase tracking-wider pl-12 w-[250px]">
                                                                            {firstCap(t('books.inventoryNumber'))}
                                                                        </th>
                                                                        <th className="py-2 px-4 font-bold uppercase tracking-wider text-center">
                                                                            {firstCap(t('common.status'))}
                                                                        </th>
                                                                        <th className="py-2 px-4 font-bold uppercase tracking-wider text-right pr-6 w-[200px]">
                                                                            {firstCap(t('common.actions.actions'))}
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-[rgb(var(--color-border))]/40">
                                                                    {groupedBook.copies.map((copy) => (
                                                                        <tr key={copy.id} className="hover:bg-[rgb(var(--color-bg-secondary))]/20 transition-colors">
                                                                            <td className="py-2.5 px-4 font-mono text-xs text-[rgb(var(--color-text))] pl-12">
                                                                                <span className="flex items-center gap-1.5">
                                                                                    <span className="material-symbols-outlined text-sm text-[rgb(var(--color-text-muted))]/55">
                                                                                        barcode_reader
                                                                                    </span>
                                                                                    {copy.inventoryNumber}
                                                                                </span>
                                                                            </td>

                                                                            <td className="py-2.5 px-4 text-center">
                                                                                {copy.returned ? (
                                                                                    <div className="flex flex-col items-center">
                                                                                        <span className="text-[rgb(var(--color-success-500))] font-bold flex items-center gap-0.5">
                                                                                            <span className="material-symbols-outlined text-xs">
                                                                                                task_alt
                                                                                            </span>
                                                                                            {firstCap(t('common.statusValues.returned'))}
                                                                                        </span>
                                                                                        {copy.returnDate && (
                                                                                            <span className="text-[9px] text-[rgb(var(--color-text-muted))]/60 font-semibold mt-0.5">
                                                                                                {new Date(copy.returnDate).toLocaleString(undefined, { timeZone: localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone })}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="text-[rgb(var(--color-error-500))] font-extrabold uppercase tracking-wide flex items-center justify-center gap-0.5 animate-pulse">
                                                                                        <span className="material-symbols-outlined text-xs">
                                                                                            pending
                                                                                        </span>
                                                                                        {firstCap(t('common.statusValues.notReturned'))}
                                                                                    </span>
                                                                                )}
                                                                            </td>

                                                                            <td className="py-2.5 px-4 text-right pr-6">
                                                                                {!copy.returned ? (
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-7 py-0.5 px-2.5 border border-[rgb(var(--color-success-500))]/30 text-[rgb(var(--color-success-500))] hover:bg-[rgb(var(--color-success-500))]/10 hover:border-[rgb(var(--color-success-500))] rounded text-[10px] font-bold transition-all"
                                                                                        leftIcon={
                                                                                            <span className="material-symbols-outlined text-xs">
                                                                                                check_circle
                                                                                            </span>
                                                                                        }
                                                                                        onClick={() => onReturnSingleCopy(copy.id)}
                                                                                    >
                                                                                        <span>
                                                                                            {firstCap(t('loans.TableLoanRow.returnCopy'))}
                                                                                        </span>
                                                                                    </Button>
                                                                                ) : (
                                                                                    <span className="text-[10px] font-semibold text-[rgb(var(--color-text-muted))]/40 select-none">
                                                                                        {firstCap(t('loans.TableLoanRow.noPendingActions'))}
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-xs font-semibold text-[rgb(var(--color-error-500))]">
                                    <span>{firstCap(t('loans.TableLoanRow.errors.loadDetails'))} </span>
                                    <span
                                        className='hover:text-[rgb(var(--color-primary-500))] hover:cursor-pointer transition-colors'
                                        onClick={refreshDetails}>{firstCap(t('common.tryAgain'))}</span>
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </Fragment>
    );
}