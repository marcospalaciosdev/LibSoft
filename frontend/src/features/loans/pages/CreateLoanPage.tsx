import { useState, useRef, type ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Spinner } from '@/shared/components/ui';
import { cn } from '@/shared/utils';

import { loansApi } from '../api/loans.api';

import { booksApi } from '@/features/books/api/books.api';
import { borrowersApi } from '@/features/borrowers/api/borrowers.api';

import type { Book, BorrowerDTO, LoanType, CreateLoanDTO, LoanDetail, BookCopy, DataStatus } from '@LibSoft/shared-types';
import { useTranslation } from 'react-i18next';
import { firstCap } from '@/shared/utils/firstCap';
import clsx from 'clsx';
import { LoanSummaryModal } from '../components/LoanSummaryModal';
import { useOutsideClick } from '@/shared/hooks/useOutsideClick';

interface SelectedBook extends Book {
  selectedCopies: { copy_id: string; inventory_number: string }[];
}

const formatDateTimeLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function CreateLoanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [borrower_selected, setBorrower_selected] = useState<BorrowerDTO | null>(null);
  const [items_selected, setItems_selected] = useState<SelectedBook[]>([]);
  const [bookCopiesMap, setBookCopiesMap] = useState<Record<string, BookCopy[]>>({});
  const [loanType, setLoanType] = useState<LoanType>('scholastic');
  const [loanDate, setLoanDate] = useState(formatDateTimeLocal(new Date()));
  const [dueDate, setDueDate] = useState(formatDateTimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  const [notes, setNotes] = useState('');

  const [createdLoan, setCreatedLoan] = useState<LoanDetail | null>(null);

  const [submitStatus, setSubmitStatus] = useState<DataStatus>('idle');
  const [books_suggestions, setBooks_suggestions] = useState<Book[]>([]);
  const [books_suggested_toggle, setBooks_suggested_toggle] = useState(false);
  const [books_searchValue, setBooks_searchValue] = useState('');
  const [selectedUnitField, setSelectedUnitField] = useState<{ bookId: string; slotIndex: number } | null>(null);

  const [borrowers_suggestions, setBorrowers_suggestions] = useState<BorrowerDTO[]>([]);
  const [borrowers_suggested_toggle, setBorrowers_suggested_toggle] = useState(false);
  const [borrowers_searchValue, setBorrowers_searchValue] = useState('');

  const [searchStatus, setSearchStatus] = useState<{ books: DataStatus; borrowers: DataStatus }>({ books: 'idle', borrowers: 'idle' });

  const [units_suggestions, setUnits_suggestions] = useState<BookCopy[]>([]);

  const [loanSummaryModalIsOpen, setLoanSummaryModalIsOpen] = useState<boolean>(false);

  const [notSelectableBorrowerId, setNotSelectableBorrowerId] = useState<string>('');
  const notSelectableBorrowerRef = useRef<HTMLDivElement>(null);

  useOutsideClick([notSelectableBorrowerRef], () => setNotSelectableBorrowerId(''));

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bookSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBorrowerSearch = async (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    setBorrowers_searchValue(value);
    if (!value.trim()) {
      setBorrowers_suggestions([]);
      setBorrowers_suggested_toggle(false);
      setNotSelectableBorrowerId('');
      setSearchStatus(prev => ({ ...prev, borrowers: 'idle' }));
      return;
    }

    setSearchStatus(prev => ({ ...prev, borrowers: 'loading' }));
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const isDni = /^\d+$/.test(value);
        const params = isDni ? { dni: value, limit: 5 } : { name: value, limit: 5 };
        const response = await borrowersApi.getAll(params);
        const results = Array.isArray(response) ? response : (response as any).data || [];
        setBorrowers_suggestions(results);
        setBorrowers_suggested_toggle(true);
        setSearchStatus(prev => ({ ...prev, borrowers: 'success' }));
      } catch (error) {
        console.error("Error searching borrowers:", error);
        setSearchStatus(prev => ({ ...prev, borrowers: 'error' }));
      }
    }, 300);
  };

  const handleBookSearch = async (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (bookSearchTimeoutRef.current) clearTimeout(bookSearchTimeoutRef.current);

    setBooks_searchValue(value);
    if (!value.trim()) {
      setBooks_suggestions([]);
      setBooks_suggested_toggle(false);
      setSearchStatus(prev => ({ ...prev, books: 'idle' }));
      return;
    }

    setSearchStatus(prev => ({ ...prev, books: 'loading' }));
    bookSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const isIsbn = /^\d+(-?\d+)*$/.test(value);
        const params = isIsbn ? { isbn: value, limit: 5 } : { title: value, limit: 5 };
        const response = await booksApi.getAll(params);
        const results = Array.isArray(response) ? response : (response as any).data || [];
        setBooks_suggestions(results);
        setBooks_suggested_toggle(true);
        setSearchStatus(prev => ({ ...prev, books: 'success' }));
      } catch (error) {
        console.error("Error searching books:", error);
        setSearchStatus(prev => ({ ...prev, books: 'error' }));
      }
    }, 300);
  };

  const handleBorrowerSelect = (borrower: BorrowerDTO) => {

    if (borrower.status === 'disabled') {
      if (borrower.id === notSelectableBorrowerId) return;

      setNotSelectableBorrowerId(borrower.id);
      return;
    };

    setBorrower_selected(borrower);
    setBorrowers_suggested_toggle(false);
    setBorrowers_searchValue('');
  };

  const handleBookSelect = async (book: Book) => {

    setUnits_suggestions([]);

    const exists = items_selected.find(i => i.id === book.id);
    if (exists) {
      setBooks_suggested_toggle(false);
      setBooks_searchValue('');
      return;
    }

    if (!bookCopiesMap[book.id]) {
      try {
        const copies = await booksApi.getUnits({ bookId: book.id, onlyAvailable: false, limit: 10, page: 1 });
        setBookCopiesMap(prev => ({ ...prev, [book.id]: copies as unknown as BookCopy[] }));
      } catch (error) {
        console.error('Error fetching book copies:', error);
      }
    }

    setItems_selected(prev => [...prev, { ...book, selectedCopies: [] }]);
    setBooks_suggested_toggle(false);
    setBooks_searchValue('');
  };

  const handleUnitSelect = (bookId: string, slotIndex: number, copy_id: string, inventory_number: string) => {
    setItems_selected(prev => prev.map(item => {
      if (item.id === bookId) {
        const newSelected = [...item.selectedCopies];
        newSelected[slotIndex] = { copy_id, inventory_number };
        return { ...item, selectedCopies: newSelected };
      }
      return item;
    }));
  };

  const handleAddUnitSlot = (bookId: string) => {
    setItems_selected(prev => prev.map(item => {
      if (item.id === bookId) {
        return { ...item, selectedCopies: [...item.selectedCopies, { copy_id: '', inventory_number: '' }] };
      }
      return item;
    }));
  };

  const handleRemoveUnitSlot = (bookId: string, slotIndex: number) => {
    setItems_selected(prev => prev.map(item => {
      if (item.id === bookId) {
        const newSelected = item.selectedCopies.filter((_, idx) => idx !== slotIndex);
        return { ...item, selectedCopies: newSelected.length === 0 ? [{ copy_id: '', inventory_number: '' }] : newSelected };
      }
      return item;
    }));
  };

  const getCurrentlySelectedCopyIdentifiers = () => {
    const selectedIds = new Set<string>();
    const selectedNumbers = new Set<string>();

    items_selected.forEach(item => {
      item.selectedCopies.forEach(copy => {
        if (copy.copy_id) selectedIds.add(String(copy.copy_id));
        if (copy.inventory_number) selectedNumbers.add(String(copy.inventory_number).trim());
      });
    });

    return { selectedIds, selectedNumbers };
  };

  const handleBookRemove = (id: string) => {
    setItems_selected(prev => prev.filter(item => item.id !== id));
  };

  const handleUnitSearch = async (bookId: string, searchTerm: string) => {
    try {
      const suggestions = await booksApi.getUnits({
        bookId,
        onlyAvailable: false,
        limit: 10,
        page: 1,
        searchTerm: searchTerm
      });

      const { selectedIds, selectedNumbers } = getCurrentlySelectedCopyIdentifiers();

      const availableUnits = (suggestions as unknown as BookCopy[]).filter((unit) => {
        const unitIdStr = String(unit.id);
        const unitNumberStr = String(unit.inventoryNumber).trim();

        const isIdSelected = selectedIds.has(unitIdStr);
        const isNumberSelected = selectedNumbers.has(unitNumberStr);

        return !isIdSelected && !isNumberSelected;
      });

      setUnits_suggestions(availableUnits);
    } catch (error) {
      console.error("Error fetching units suggestions:", error);
      setUnits_suggestions([]);
    }
  };

  const isFormValid = borrower_selected &&
    items_selected.length > 0 &&
    items_selected.every(item => item.selectedCopies.length > 0 && item.selectedCopies.every(c => c.copy_id !== '')) &&
    submitStatus !== 'loading';

  const handleSubmit = async () => {
    if (!borrower_selected || items_selected.length === 0) return;

    setSubmitStatus('loading');
    try {
      const payload: CreateLoanDTO = {
        borrowerId: borrower_selected.id,
        itemsIds: items_selected.map(item => ({
          id: item.id,
          quantity: item.selectedCopies.filter(c => c.copy_id !== '').length,
          copyIds:
            item.selectedCopies.
              filter(c => c.copy_id !== '')
              .map(c => c.copy_id.replace('# ', ''))
        })),
        type: loanType,
        loanDate: new Date(loanDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        additionalInfo: notes
      };

      const loan = await loansApi.create(payload);
      setCreatedLoan(loan);

      setLoanSummaryModalIsOpen(true);
      setSubmitStatus('success');
    } catch (error) {
      console.error("Error creating loan:", error);
      setSubmitStatus('error');
    }
  };

  useEffect(() => {
    if (selectedUnitField) {
      const { bookId } = selectedUnitField;
      handleUnitSearch(bookId, '');
    }
  }, [selectedUnitField])

  return (
    <div className="p-6 w-full h-full flex flex-col overflow-y-auto overflow-x-hidden animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-row items-center justify-between mb-6">
        <div className="flex flex-row items-center gap-3">
          <Button
            variant="ghost"
            className="rounded-md w-10 h-10 p-0 flex items-center justify-center hover:bg-[rgb(var(--color-surface))]"
            onClick={() => navigate('/loans')}
          >
            <span className="material-symbols-outlined text-2xl text-[rgb(var(--color-text-muted))]">arrow_back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">{firstCap(t('loans.addModal.title'))}</h1>
            <p className="text-sm text-[rgb(var(--color-text-muted))]/80">{firstCap(t('loans.addModal.subtitle'))}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-md font-medium px-4" onClick={() => navigate('/loans')}>
            {firstCap(t('common.actions.cancel'))}
          </Button>
          <Button
            onClick={handleSubmit}
            className="rounded-md font-medium px-8 bg-[rgb(var(--color-primary-500))] text-white hover:bg-[rgb(var(--color-primary-600))] shadow-sm transition-all duration-300"
            isDisabled={!isFormValid}
            leftIcon={submitStatus === 'loading' ? <Spinner size="sm" className="text-white" /> : undefined}
          >
            {submitStatus === 'loading' ? firstCap(t('common.saving')) + '...' : firstCap(t('loans.registerLoan'))}
          </Button>
        </div>
      </div>

      {/* Bento Grid Layout - Corregido agregando la clase 'grid' */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 pb-10 items-start">
        {/* Left Column - Main Forms */}
        <div className="flex flex-col gap-6">

          {/* Borrower Selection Card */}
          <div className="bg-[rgb(var(--color-bg))] rounded-lg shadow-sm p-5 border border-[rgb(var(--color-border))]/40">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] select-none">person</span>
              <h2 className="text-base font-bold text-[rgb(var(--color-text))]">{firstCap(t('loans.addModal.borrowerSection'))}</h2>
            </div>

            <div className="space-y-6">
              {!borrower_selected ? (
                <div className="relative">
                  <Input
                    placeholder={firstCap(t('loans.addModal.borrowerPlaceholder'))}
                    onChange={handleBorrowerSearch}
                    value={borrowers_searchValue}
                    autoComplete="off"
                    inputClassName="bg-[rgb(var(--color-bg-secondary))] border-none focus:bg-[rgb(var(--color-bg))] rounded-md text-sm px-4 h-11"
                    helperText={(searchStatus.borrowers === 'loading' && borrowers_searchValue !== '') ? firstCap(t('common.searching')) + '...' : ''}
                  />

                  {/* Suggestions Dropdown */}
                  <div className={cn(
                    'absolute top-full mt-2 w-full z-50 rounded-lg overflow-hidden shadow-xl border border-[rgb(var(--color-border))]/50 bg-[rgb(var(--color-surface))]/95 backdrop-blur-xl max-h-60 overflow-y-auto transition-all duration-300',
                    (!borrowers_suggested_toggle || borrowers_suggestions.length === 0) ? 'opacity-0 translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                  )}>
                    <div className="p-1 flex flex-col gap-1">
                      {borrowers_suggestions.map((borrower) => (
                        <div>
                          <div
                            ref={notSelectableBorrowerId === borrower.id ? notSelectableBorrowerRef : null}
                            key={borrower.id}
                            onClick={() => handleBorrowerSelect(borrower)}
                            className={`flex items-center justify-between p-3  transition-all duration-200 cursor-pointer rounded-md hover:bg-[rgb(var(--color-bg-secondary))] group`}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[rgb(var(--color-primary-500))]/10 flex items-center justify-center border border-[rgb(var(--color-primary-500))]/20">
                                <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] text-lg">person</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary-500))]">
                                  {`${borrower.firstName || (borrower as any).name || ''} ${borrower.lastName || (borrower as any).surname || ''}`.trim()}
                                </span>
                                <span className="text-[10px] text-[rgb(var(--color-text-muted))]">DNI: {(borrower as any).dni || 'N/A'}</span>
                              </div>
                            </div>
                            <div className={clsx("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm", {
                              "border-emerald-500/30 text-emerald-500 bg-emerald-500/10": borrower.status === 'enabled',
                              "border-red-500/30 text-red-500 bg-red-500/10": borrower.status === 'disabled',
                              "border-amber-500/30 text-amber-500 bg-amber-500/10": borrower.status === 'withDebt'
                            })}>
                              {firstCap(t(`common.statusValues.${borrower.status}` || ''))}
                            </div>
                          </div>
                          {borrower.id == notSelectableBorrowerId &&
                            <span className='w-full py-3 px-2 text-(length:--fs-caption) text-red-500'>
                              This borrower can't be selected
                            </span>
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-5 bg-[rgb(var(--color-bg-secondary))]/50 rounded-xl border border-[rgb(var(--color-border))]/40 animate-in zoom-in duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[rgb(var(--color-primary-500))] flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined text-white text-2xl">person</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-[rgb(var(--color-text))]">
                        {`${borrower_selected.firstName || (borrower_selected as any).name || ''} ${borrower_selected.lastName || (borrower_selected as any).surname || ''}`.trim()}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-[rgb(var(--color-text-muted))]">
                        <span>DNI: {(borrower_selected as any).dni || 'N/A'}</span>
                        <span className="w-1 h-1 rounded-full bg-[rgb(var(--color-text-muted))]/30"></span>
                        <span>{(borrower_selected as any).email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="rounded-full w-9 h-9 p-0 text-[rgb(var(--color-text-muted))] hover:text-red-500 hover:bg-red-500/10"
                    onClick={() => setBorrower_selected(null)}
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Items Selection Card */}
          <div className="bg-[rgb(var(--color-bg))] rounded-lg shadow-sm p-6 border border-[rgb(var(--color-border))]/40">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] select-none">menu_book</span>
              <h2 className="text-base font-bold text-[rgb(var(--color-text))]">{firstCap(t('loans.addModal.itemSection'))}</h2>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <Input
                  placeholder={firstCap(t('loans.addModal.itemPlaceholder'))}
                  onChange={handleBookSearch}
                  value={books_searchValue}
                  autoComplete="off"
                  inputClassName="bg-[rgb(var(--color-bg-secondary))] border-none focus:bg-[rgb(var(--color-bg))] rounded-md text-sm h-11"
                  helperText={(searchStatus.books === 'loading' && books_searchValue !== '') ? firstCap(t('common.searching')) + '...' : ''}
                />

                {/* Book Suggestions Dropdown */}
                <div className={cn(
                  'absolute top-full mt-2 w-full z-40 rounded-lg overflow-hidden shadow-xl border border-[rgb(var(--color-border))]/50 bg-[rgb(var(--color-surface))]/95 backdrop-blur-xl max-h-60 overflow-y-auto transition-all duration-300',
                  (!books_suggested_toggle || books_suggestions.length === 0) ? 'opacity-0 translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                )}>
                  <div className="p-1 flex flex-col gap-1">
                    {books_suggestions.map((book) => (
                      <div
                        onClick={() => handleBookSelect(book)}
                        key={book.id}
                        className="flex items-center justify-between p-3 rounded-md hover:bg-[rgb(var(--color-bg-secondary))] transition-all duration-200 cursor-pointer group gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[rgb(var(--color-bg-secondary))] border border-[rgb(var(--color-border))]/50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-primary-500))]">menu_book</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary-500))] line-clamp-1">{book.title}</span>
                            <span className="text-[10px] text-[rgb(var(--color-text-muted))]">{book.author} · {book.isbn}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[rgb(var(--color-primary-500))]/10 text-[rgb(var(--color-primary-500))] border border-[rgb(var(--color-primary-500))]/20">
                          {book.copiesAvailable} {t('loans.addModal.left')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected Books List */}
              {items_selected.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {items_selected.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2 p-4 rounded-xl border border-[rgb(var(--color-border))]/40 bg-[rgb(var(--color-bg-secondary))]/30 hover:bg-[rgb(var(--color-bg-secondary))]/50 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[rgb(var(--color-bg))] rounded-md border border-[rgb(var(--color-border))]/40 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl text-[rgb(var(--color-text-muted))]">menu_book</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-[rgb(var(--color-text))]">{item.title}</span>
                            <span className="text-xs text-[rgb(var(--color-text-muted))] font-medium">{item.author}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[rgb(var(--color-text-muted))] hover:text-red-500 hover:bg-red-500/10 transition-all duration-300"
                          onClick={() => handleBookRemove(item.id)}
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>

                      <div className="w-full mt-2">
                        <span className="text-xs font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">{t('loans.addModal.addInventoryUnit')}</span>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] items-center gap-2 mt-3">
                          {item.selectedCopies.map((selectedCopy, slotIndex) => {

                            return (
                              <div key={slotIndex} className="flex items-center gap-1 w-full">
                                <Input
                                  onClick={() => setSelectedUnitField({
                                    bookId: item.id,
                                    slotIndex
                                  })}
                                  className='w-full'
                                  inputType="text"
                                  suggestions={
                                    selectedUnitField?.bookId === item.id && selectedUnitField?.slotIndex === slotIndex ?
                                      units_suggestions.map(unit => ({
                                        value: String(unit.id),
                                        label: `# ${unit.inventoryNumber}`
                                      })) : []}
                                  value={selectedCopy.inventory_number}
                                  onSuggestionClick={(selectedValue: string, label: string) => {
                                    handleUnitSelect(item.id, slotIndex, selectedValue, label)
                                  }}
                                  onChange={(e) => handleUnitSearch(item.id, e.target.value)}
                                  placeholder={firstCap(t('loans.addModal.selectUnit') || 'Seleccionar unidad')}
                                  inputClassName="bg-[rgb(var(--color-bg))] border-[rgb(var(--color-border))]/60 rounded-md text-xs h-10"
                                />
                                {item.selectedCopies.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveUnitSlot(item.id, slotIndex)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-[rgb(var(--color-text-muted))] hover:text-red-500 hover:bg-red-500/10 shrink-0"
                                  >
                                    <span className="material-symbols-outlined text-base">close</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {(() => {
                            const copies = bookCopiesMap[item.id] || [];
                            const allSelected = getCurrentlySelectedCopyIdentifiers();
                            const availableCount = copies.filter(c => !allSelected.selectedIds.has(String(c.id))).length;
                            return availableCount > 0 && (
                              <Button
                                variant="default"
                                className="border-2 rounded-md border-dashed border-[rgb(var(--color-border))]/60 bg-transparent h-10 flex items-center justify-center gap-2 text-[rgb(var(--color-primary-500))]! hover:bg-[rgb(var(--color-surface))] uppercase text-xs"
                                leftIcon={<span className="material-symbols-outlined font-bold text-sm">add</span>}
                                onClick={() => handleAddUnitSlot(item.id)}
                              >
                                {firstCap(t('loans.addModal.addAnotherUnit'))}
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 rounded-xl border border-dashed border-[rgb(var(--color-border))]/40 bg-[rgb(var(--color-bg-secondary))]/10">
                  <span className="material-symbols-outlined text-3xl text-[rgb(var(--color-text-muted))]/30 mb-3 select-none">inventory_2</span>
                  <p className="text-sm italic text-[rgb(var(--color-text-muted))]">{firstCap(t('loans.addModal.noBooksSelected'))}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Config & Summary */}
        <div className="flex flex-col gap-6">
          {/* Config Card */}
          <div className="bg-[rgb(var(--color-bg))] rounded-lg shadow-sm p-6 border border-[rgb(var(--color-border))]/40">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] select-none">settings</span>
              <h2 className="text-base font-bold text-[rgb(var(--color-text))]">{firstCap(t('loans.addModal.loanType'))}</h2>
            </div>
            <div className="space-y-6">
              <div className="flex gap-2 p-1.5 bg-[rgb(var(--color-bg-secondary))] rounded-md border border-[rgb(var(--color-border))]/40">
                <button
                  onClick={() => setLoanType('scholastic')}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold rounded-md transition-all duration-300",
                    loanType === 'scholastic' ? "bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))] shadow-xs" : "text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]"
                  )}
                >
                  {firstCap(t('loans.addModal.scholastic'))}
                </button>
                <button
                  onClick={() => setLoanType('domiciliary')}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold rounded-md transition-all duration-300",
                    loanType === 'domiciliary' ? "bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))] shadow-xs" : "text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]"
                  )}
                >
                  {firstCap(t('loans.addModal.domiciliary'))}
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label={<span className="text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">{t('loans.addModal.loanDate')}</span>}
                  type="datetime-local"
                  value={loanDate}
                  onChange={(e) => setLoanDate(e.target.value)}
                  inputClassName="bg-[rgb(var(--color-bg-secondary))] border-none focus:bg-[rgb(var(--color-bg))] rounded-md text-sm h-10"
                />
                <Input
                  label={<span className="text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">{t('loans.addModal.dueDate')}</span>}
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={loanDate}
                  inputClassName="bg-[rgb(var(--color-bg-secondary))] border-none focus:bg-[rgb(var(--color-bg))] rounded-md text-sm h-10"
                />
              </div>

              <Input
                inputType="textarea"
                label={<span className="text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">{t('loans.addModal.additionalNotes')}</span>}
                placeholder={firstCap(t('loans.addModal.notesPlaceholder'))}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                inputClassName="bg-[rgb(var(--color-bg-secondary))] border-none focus:bg-[rgb(var(--color-bg))] rounded-md p-3 min-h-[100px] text-sm resize-none"
              />
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-[rgb(var(--color-primary-500))]/5 rounded-lg border border-[rgb(var(--color-primary-500))]/20 p-6">
            <h2 className="font-bold text-sm text-[rgb(var(--color-text))] uppercase tracking-wider mb-6">{firstCap(t('loans.addModal.loanSummary'))}</h2>

            <div className="space-y-4">
              <div className="flex justify-between text-xs">
                <span className="text-[rgb(var(--color-text-muted))]">{firstCap(t('common.roles.borrower'))}</span>
                <span className="font-bold text-[rgb(var(--color-text))]">{borrower_selected ? `${borrower_selected.firstName || (borrower_selected as any).name || ''} ${borrower_selected.lastName || (borrower_selected as any).surname || ''}`.trim() : firstCap(t('loans.addModal.noBorrowerSelected'))}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[rgb(var(--color-text-muted))]">{firstCap(t('loans.selectedBooks'))}</span>
                <span className="font-bold text-[rgb(var(--color-text))]">{items_selected.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[rgb(var(--color-text-muted))]">{firstCap(t('loans.addModal.totalCopies'))}</span>
                <span className="font-bold text-[rgb(var(--color-text))]">{items_selected.reduce((acc, curr) => acc + curr.selectedCopies.filter(c => c.copy_id !== '').length, 0)}</span>
              </div>

              <div className="h-px bg-[rgb(var(--color-primary-500))]/10 my-2" />

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[rgb(var(--color-primary-600))] uppercase tracking-widest">{firstCap(t('loans.returnDate'))}</span>
                <span className="text-xl font-black text-[rgb(var(--color-primary-600))]">
                  {dueDate ? new Date(dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                </span>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={cn(
                  "w-full h-12 bg-[rgb(var(--color-primary-500))] hover:bg-[rgb(var(--color-primary-600))] text-white font-bold rounded-md shadow-sm transition-all duration-300 mt-4 flex items-center justify-center gap-2",
                  !isFormValid && "opacity-50 grayscale cursor-not-allowed shadow-none"
                )}
              >
                {submitStatus === 'loading' ? <Spinner size="sm" className="text-white" /> : <span className="material-symbols-outlined text-lg">check_circle</span>}
                {submitStatus === 'loading' ? t('common.saving') : "Confirmar Pr?stamo"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <LoanSummaryModal
        isOpen={loanSummaryModalIsOpen}
        onClose={() => setLoanSummaryModalIsOpen(false)}
        loan={createdLoan as LoanDetail}
      />
    </div>
  );
}