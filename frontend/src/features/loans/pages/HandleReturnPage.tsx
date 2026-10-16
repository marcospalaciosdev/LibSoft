import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loansApi } from '../api/loans.api';
import type { LoanDetail, DataStatus } from "@LibSoft/shared-types";
import { firstCap } from '@/shared/utils/firstCap';
import { Button, Badge, Spinner } from '@/shared/components/ui';
import { ErrorState } from '@/shared/components/feedback';
import { formatDate } from '@/shared/utils/formatDate';

type selectedCopy = {
    copyId: number;
    returnedAt: Date | null;
}

export function HandleReturnPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [loan, setLoan] = useState<LoanDetail | null>(null);
    const [pageStatus, setPageStatus] = useState<DataStatus>('loading');
    const [selectedCopies, setSelectedCopies] = useState<selectedCopy[]>([]);
    const [submitStatus, setSubmitStatus] = useState<DataStatus>('idle');

    const fetchLoan = useCallback(async () => {
        if (!id) {
            setPageStatus('error');
            return;
        }

        setPageStatus('loading');
        try {
            const response = await loansApi.getById(id);

            setLoan(response);
            setSelectedCopies(
                response.items?.flatMap(item =>
                    item.copies.map(c => ({
                        copyId: c.id,
                        returnedAt: c.returned ? (c.returnDate ? new Date(c.returnDate) : new Date()) : null
                    }))
                )
            );
            setPageStatus('success');
        } catch (error) {
            console.error("Error fetching loan details:", error);
            setPageStatus('error');
        }
    }, [id]);

    useEffect(() => {
        fetchLoan();
    }, [fetchLoan]);

    const handleToggleCopy = (copyId: number) => {
        setSelectedCopies(prev =>
            prev.map(copy => {
                if (copy.copyId === copyId) {
                    return {
                        ...copy,
                        returnedAt: copy.returnedAt ? null : new Date()
                    };
                }
                return copy;
            })
        );
    };

    const handleReturn = async () => {
        if (!id || selectedCopies.length === 0) return;

        setSubmitStatus('loading');
        try {
            const copiesPayload = selectedCopies.map(c => ({
                copyId: c.copyId,
                returned: c.returnedAt !== null,
                returnDate: c.returnedAt ? c.returnedAt.toISOString() : null
            }));

            await loansApi.returnBook(id, copiesPayload);
            setSubmitStatus('success');
            navigate('/loans');
        } catch (error) {
            console.error("Error returning copies:", error);
            setSubmitStatus('error');
            alert(t('common.error'));
        }
    };

    const handleSelectAll = () => {
        if (!loan) return;

        const allChecked = selectedCopies.every(copy => copy.returnedAt !== null);

        setSelectedCopies(prev =>
            prev.map(copy => ({
                ...copy,
                returnedAt: allChecked ? null : (copy.returnedAt || new Date())
            }))
        );
    };

    if (pageStatus === 'loading') {
        return (
            <div className='flex items-center justify-center h-[50vh]'>
                <Spinner size="lg" />
            </div>
        );
    }

    if (pageStatus === 'error') {
        return (
            <ErrorState
                title={firstCap(t('common.errorMessages.error'))}
                message={firstCap(t('loans.handleReturnPage.errorLoadingLoan', { defaultValue: 'No se pudo cargar el pr?stamo.' }))}
                retryLabel={firstCap(t('common.actions.retry'))}
                onRetry={fetchLoan}
            />
        );
    }

    if (!loan) {
        return <span></span>;
    }

    const selectedAll = selectedCopies.length > 0 && selectedCopies.every(copy => !!copy.returnedAt);
    const totalCopiesCount = loan.items?.reduce((acc, item) => acc + item.copies.length, 0);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 relative p-6">
            <div className='flex flex-row items-center gap-5'>
                <Button
                    variant="default"
                    onClick={() => navigate('/loans')}
                    className="p-0! text-[rgb(var(--color-text-muted))] rounded-full hover:text-[rgb(var(--color-primary-500))]"
                    disabled={submitStatus === 'loading'}
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-[rgb(var(--color-text))] flex flex-row items-center gap-2">
                        {firstCap(t('loans.handleReturnPage.title'))}
                    </h1>
                    <p className="text-[rgb(var(--color-text-muted))]/60 mt-1 text-sm">
                        {firstCap(t('loans.handleReturnPage.subtitle'))}
                    </p>
                </div>
            </div>

            <div className='w-full flex flex-col items-center'>
                <div className='bg-[rgb(var(--color-bg))] w-[60%] p-5 rounded-md shadow-sm mb-5'>
                    <div className='border-b border-[rgb(var(--color-border))] flex flex-row justify-between'>
                        <div className='flex flex-col gap-2 pb-5'>
                            <span className='uppercase font-bold text-(length:--fs-caption) text-[rgb(var(--color-text-muted))]'>
                                {firstCap(t('common.roles.borrower'))}
                            </span>
                            <span className='text-(length:--fs-title-sm) font-semibold text-[rgb(var(--color-text))]'>
                                {loan.borrower.firstName} {loan.borrower.lastName}
                            </span>
                            <div className='flex flex-row items-center gap-2 text-[rgb(var(--color-text-muted))]/80'>
                                <span className='material-symbols-outlined text-(length:--fs-icon-md)'>id_card</span>
                                <span className='text-(length:--fs-body-sm)'>
                                    {loan.borrower.dni}
                                </span>
                            </div>
                        </div>
                        <div className='size-12 bg-[rgb(var(--color-primary-500))]/10 flex items-center justify-center rounded-sm'>
                            <span className='material-symbols-outlined text-[rgb(var(--color-primary-500))] text-(length:--fs-icon-md)'>person</span>
                        </div>
                    </div>
                    <div className='flex flex-row pt-4'>
                        <div className='flex flex-col gap-2 flex-1'>
                            <span className='text-(length:--fs-caption) text-[rgb(var(--color-text-muted))] font-bold uppercase'>
                                {firstCap(t('loans.handleReturnPage.loanDate'))}
                            </span>
                            <div className='flex flex-row items-center gap-2'>
                                <span className='text-[rgb(var(--color-text))]'>
                                    {formatDate(loan.loanDate)}
                                </span>
                            </div>
                        </div>
                        <div className='flex flex-col gap-2 flex-1'>
                            <span className='text-(length:--fs-caption) text-[rgb(var(--color-text-muted))] font-bold uppercase'>
                                {firstCap(t('loans.handleReturnPage.totalCopies'))}
                            </span>
                            <div className='flex flex-row items-center gap-2'>
                                <span className='text-[rgb(var(--color-text))]'>
                                    {totalCopiesCount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='w-[60%] flex flex-col gap-8'>
                    <div className='flex flex-row justify-between items-center'>
                        <span className="font-semibold text-(length:--fs-title-sm) text-[rgb(var(--color-text))]">
                            {firstCap(t('loans.handleReturnPage.itemsInThisLoan'))}
                        </span>
                        <div className='flex flex-row gap-2' onClick={handleSelectAll}>
                            <div className={`w-5 h-5 cursor-pointer rounded-sm flex justify-center items-center ${selectedAll ? 'bg-[rgb(var(--color-primary-500))]' : 'border border-[rgb(var(--color-border))]'}`}>
                                {selectedAll ? (
                                    <span className='material-symbols-outlined text-white text-[16px] font-bold'>check</span>
                                ) : null}
                            </div>
                            <span className='text-[rgb(var(--color-text))] text-(length:--fs-body-sm) cursor-pointer hover:underline'>
                                {firstCap(t('common.selectAll'))}
                            </span>
                        </div>
                    </div>

                    {loan.items.map((item) => (
                        <div key={item.id} className="flex flex-col gap-4">
                            <div className="flex flex-row items-center gap-4">
                                <div className="p-5 text-(length:--fs-icon-md) bg-[rgb(var(--color-primary-500))]/10 border border-[rgb(var(--color-border))]/60 rounded-sm flex items-center justify-center aspect-square">
                                    <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))]">book_4</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-[rgb(var(--color-text))] text-[15px]">
                                        {item.title}
                                    </span>
                                    <span className="text-[13px] text-[rgb(var(--color-text-muted))]/80">
                                        {item.author} {item.year ? `? ${item.year}` : ''}
                                    </span>
                                    {item.category && (
                                        <div className="mt-1">
                                            <Badge variant="default" className="text-[9px] uppercase tracking-wider py-0 px-1.5 h-4">
                                                {item.category}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-4 border-l-2 border-[rgb(var(--color-border))]/30 pl-4">
                                {item.copies.map((copy) => {
                                    const isCopySelected = !!selectedCopies.find(c => c.copyId === copy.id)?.returnedAt;

                                    return (
                                        <div
                                            key={copy.id}
                                            onClick={() => handleToggleCopy(copy.id)}
                                            className={`bg-[rgb(var(--color-bg))] border-[rgb(var(--color-border))] flex items-center gap-4 p-3 rounded-md shadow-sm transition-all duration-200 cursor-pointer ${isCopySelected
                                                ? 'bg-[rgb(var(--color-bg))] border-[rgb(var(--color-border))] shadow-sm'
                                                : 'bg-[rgb(var(--color-bg))] border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary-500))]/40'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center w-6 h-6">
                                                <div className={`w-5 h-5 rounded-sm border-[1.5px] ${isCopySelected
                                                    ? 'bg-[rgb(var(--color-primary-500))] border-[rgb(var(--color-primary-500))]'
                                                    : 'border-[rgb(var(--color-text-muted))]/30 bg-transparent'
                                                    } flex items-center justify-center transition-colors`}>
                                                    {isCopySelected && (
                                                        <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col">
                                                <span className={`font-mono text-sm ${isCopySelected ? 'text-[rgb(var(--color-text-muted))]/60 line-through' : 'text-[rgb(var(--color-text))] font-medium'}`}>
                                                    {copy.inventoryNumber}
                                                </span>
                                                {copy.returned && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--color-primary-400))] mt-0.5">
                                                        {t('loans.handleReturnPage.alreadyReturned')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Button
                variant='primary'
                className='fixed bottom-0 right-0 m-10 rounded-md'
                onClick={handleReturn}
                disabled={submitStatus === 'loading'}
                isLoading={submitStatus === 'loading'}
            >
                {firstCap(t('loans.handleReturnPage.confirmReturn'))}
            </Button>
        </div>
    );
}
