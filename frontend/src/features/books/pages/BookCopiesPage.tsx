import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { BookCopy } from "@LibSoft/shared-types";
import { CopyTableRow } from "../components/CopyTableRow";
import { ConfirmDeleteCopyModal } from "../components/ConfirmDeleteCopyModal";
import { booksApi } from "../api/books.api";
import { Button, PaginationFooter } from "@/shared/components/ui";
import { useOutsideClick } from "@/shared/hooks/useOutsideClick";
import { firstCap } from "@/shared/utils/firstCap";

export function BookCopiesPage() {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();

    const activeLineRef = useRef<HTMLDivElement | null>(null);

    const [units, setUnits] = useState<BookCopy[]>([]);
    const [bookUnitsAmount, setBookUnitsAmount] = useState<{ total: number; available: number; borrowed: number }>();
    const [selectedCopies, setSelectedCopies] = useState<string[]>([]);
    const [copyToDetail] = useState<string | null>(null);

    const [limit, setLimit] = useState<number>(25);
    const [offset, setOffset] = useState<number>(0);

    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [editingCopyId, setEditingCopyId] = useState<string | null>(null);
    const [copyError, setCopyError] = useState<string>('');
    const [copyToDelete, setCopyToDelete] = useState<string | null>(null);

    const apiPage = Math.floor(offset / limit) + 1;

    const fetchUnits = useCallback(async () => {
        if (!id) return;
        try {
            const response = await booksApi.getUnits({
                bookId: id,
                onlyAvailable: false,
                page: apiPage,
                limit: limit
            });
            setUnits(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error('Error al obtener las unidades:', error);
            setUnits([]);
        }
    }, [id, apiPage, limit]);

    const fetchBookUnitsAmount = useCallback(async () => {
        if (!id) return;
        try {
            const response = await booksApi.getUnitsAmountByBook(id);
            setBookUnitsAmount({
                total: response.total,
                available: response.availableCopies,
                borrowed: response.borrowedCopies,
            });
        } catch (error) {
            console.error('Error al obtener la cantidad de unidades:', error);
        }
    }, [id]);

    useEffect(() => { fetchBookUnitsAmount(); }, [fetchBookUnitsAmount]);
    useEffect(() => { fetchUnits(); }, [fetchUnits]);

    useOutsideClick([activeLineRef], () => {
        setIsAdding(false);
        setEditingCopyId(null);
        setCopyError('');
    });

    const updateCopy = async (copyId: string, newInventoryNumber: string) => {
        if (!copyId) return;
        try {
            await booksApi.updateCopy(copyId, newInventoryNumber);
            setEditingCopyId(null);
            fetchUnits();
        } catch (error: any) {
            console.error('Error al actualizar la copia:', error.response?.data || error.message);
        }
    };

    const deleteCopy = async () => {
        if (!copyToDelete) return;
        try {
            await booksApi.deleteCopy(copyToDelete);
            setCopyToDelete(null);
            fetchUnits();
            fetchBookUnitsAmount();
            setSelectedCopies([]);
        } catch (error) {
            console.error('Error al eliminar la copia:', error);
        }
    };

    const checkCopyAvailability = async (inventoryNumber: string) => {
        if (!inventoryNumber?.trim()) {
            setCopyError('');
            return;
        }
        try {
            const isTaken = await booksApi.checkCopyAvailability(inventoryNumber);
            setCopyError(isTaken ? 'taken' : '');
        } catch (error) {
            console.error('Error al verificar la disponibilidad:', error);
        }
    };

    const saveCopy = async (newInventoryNumber: string) => {
        if (!id) return;
        try {
            await booksApi.createCopy(id, newInventoryNumber);
            setIsAdding(false);
            setCopyError('');
            fetchUnits();
            fetchBookUnitsAmount();
        } catch (error: any) {
            const backendError = error?.data?.errors?.inventoryNumber;
            setCopyError(backendError || 'error');
        }
    };

    const handleSelectCopy = (copyId: string) => {
        setSelectedCopies((prev) =>
            prev.includes(copyId) ? prev.filter((i) => i !== copyId) : [...prev, copyId]
        );
    };

    const handleDeleteCopiesBulk = async () => {
        if (!selectedCopies.length) return;
        try {
            await booksApi.deleteCopiesBulk(selectedCopies);
            console.log(selectedCopies);
            setSelectedCopies([]);
            fetchUnits();
            fetchBookUnitsAmount();
        } catch (error) {
            console.error('Error al eliminar las copias:', error);
        }
    };

    return (
        <div className="animate-fade-in h-full flex-1 min-h-0 flex flex-col">
            <div className="w-full flex flex-row justify-between mb-4 shrink-0">
                <Button
                    className="rounded-md"
                    variant="primary"
                    onClick={() => setIsAdding(true)}
                    tooltip={{
                        text: firstCap(t('books.actions.addCopy')),
                        className: 'text-nowrap',
                        fontSize: '10px'
                    }}
                    isDisabled={isAdding}
                    leftIcon={<span className="material-symbols-outlined text-lg leading-none">add</span>}
                >
                    {firstCap(t('common.actions.add'))}
                </Button>
                <div className="flex gap-2">
                    <Button
                        onClick={() => handleDeleteCopiesBulk()}
                        variant="ghost"
                        className="p-0! aspect-square rounded-md"
                        isDisabled={selectedCopies.length < 1}
                        tooltip={{ text: firstCap(t('common.actions.delete')), fontSize: '10px', className: 'text-nowrap' }}
                    >
                        <span className="text-(length:--fs-icon-md) material-symbols-outlined">
                            delete
                        </span>
                    </Button>
                </div>
            </div>

            <div className={`w-full flex-1 min-h-0 flex flex-row transition-all duration-500 ease-in-out
                    ${copyToDetail ? 'gap-3' : 'gap-0'}
                `}>
                <div className="rounded-md overflow-hidden bg-[rgb(var(--color-bg))] flex flex-col border border-[rgb(var(--color-border))] flex-1 min-h-0">
                    <div className="w-full flex shrink-0 bg-[rgb(var(--color-bg))] border-b border-[rgb(var(--color-border))] z-10">
                        <ul className="w-full grid grid-cols-[30px_1fr_1fr_1fr_1fr] px-4 items-center py-3">
                            <li />
                            <li className="text-[rgb(var(--color-text-muted))] uppercase tracking-wider font-semibold text-(length:--fs-caption)">
                                {t('books.manage.inventory.inventoryNumber')}
                            </li>
                            <li className="text-center text-[rgb(var(--color-text-muted))] uppercase tracking-wider font-semibold text-(length:--fs-caption)">
                                {t('books.manage.inventory.status')}
                            </li>
                            <li className="text-center text-[rgb(var(--color-text-muted))] uppercase tracking-wider font-semibold text-(length:--fs-caption)">
                                {t('books.manage.inventory.loanCount')}
                            </li>
                            <li className="text-center text-[rgb(var(--color-text-muted))] uppercase tracking-wider font-semibold text-(length:--fs-caption)">
                                {t('books.manage.inventory.actions')}
                            </li>
                        </ul>
                    </div>

                    <div className="flex-1 min-h-0 relative overflow-y-auto custom-scrollbar flex flex-col">
                        {isAdding && (
                            <CopyTableRow
                                ref={activeLineRef}
                                key="new"
                                unit={{ isAvailable: false, timesLoaned: 0 } as BookCopy}
                                onInputChange={checkCopyAvailability}
                                isEditing={true}
                                onCancel={() => {
                                    setCopyError('');
                                    setIsAdding(false);
                                }}
                                onSave={saveCopy}
                                error={copyError ? (firstCap(t(`books.editBook.inventory.errors.${copyError}`)) as string) : ''}
                            />
                        )}

                        {units.length > 0 ? (
                            units.map((unit) => (
                                <CopyTableRow
                                    ref={editingCopyId === unit.id ? activeLineRef : null}
                                    key={unit.id}
                                    unit={unit}
                                    isEditing={editingCopyId === unit.id}
                                    onEdit={() => setEditingCopyId(unit.id)}
                                    onCancel={() => {
                                        setCopyError('');
                                        setEditingCopyId(null);
                                    }}
                                    onSave={(newInventoryNumber) => updateCopy(unit.id, newInventoryNumber)}
                                    onDelete={() => setCopyToDelete(unit.id)}
                                    onInputChange={checkCopyAvailability}
                                    onSelect={handleSelectCopy}
                                    isSelected={selectedCopies.includes(unit.id)}
                                />
                            ))
                        ) : !isAdding && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center w-full h-full p-8 text-[rgb(var(--color-text-muted))]">
                                <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                                    <span className="material-symbols-outlined text-5xl select-none">inventory_2</span>
                                    <p className="text-sm">{firstCap(t('books.manage.inventory.noCopies'))}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <PaginationFooter
                        totalItems={bookUnitsAmount?.total ?? 0}
                        limit={limit}
                        offset={offset}

                        onPageChange={setOffset}
                        onLimitChange={setLimit}

                        limitOptions={[25, 50, 100, 200]}

                        resultsCountText={() =>
                            firstCap(t('common.results_count', { count: units.length ?? 0 }))
                        }
                        resultsPerPageLabel={
                            <span className='text-(length:--fs-caption) text-[rgb(var(--color-text-muted))]'>
                                {firstCap(t('common.resultsPerPage'))}
                            </span>
                        }
                    />
                </div>
            </div>

            <ConfirmDeleteCopyModal
                isOpen={!!copyToDelete}
                onConfirm={deleteCopy}
                onCancel={() => setCopyToDelete(null)}
            />
        </div>
    );
}