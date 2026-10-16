import {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

import { useOutsideClick } from '@/shared/hooks/useOutsideClick';
import { SectionHeader } from '@/shared/components/layout/SectionHeader';
import { Button, SearchBar, DropDownMenu } from '@/shared/components/ui';
import { firstCap } from '@/shared/utils/firstCap';
import { loansApi } from '../api/loans.api';
import { LoansTable } from '../components/LoansTable';

import type { Loan, Book, BorrowerDTO, BookCopy, DataStatus } from '@LibSoft/shared-types';
import { borrowersApi } from '../../borrowers/api/borrowers.api';
import { booksApi } from '@/features/books/api/books.api';
import { ErrorState } from '@/shared/components/feedback';

const orderBy_options = [
  { value: 'loanDate', label: 'loans.all.orderBy.loanDate' },
  { value: 'dueDate', label: 'loans.all.orderBy.dueDate' },
  { value: 'totalCopies', label: 'loans.all.orderBy.totalCopies' }
];

const statusFilter_defaultOption = 'all';
const sortBy_defaultOption = 'loanDate';

export function DetailedLoansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [totalLoans, setTotalLoans] = useState(0);
  const [tabStatus, setTabStatus] = useState<DataStatus>('idle');

  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const [statusFilter, setStatusFilter] = useState(statusFilter_defaultOption);
  const [sortBy, setSortBy] = useState(sortBy_defaultOption);
  const [filtersOnDefault, setFiltersOnDefault] = useState(true);
  const [searchBy, setSearchBy] = useState('all');

  const [selectedBorrowers, setSelectedBorrowers] = useState<{ id: string; name: string }[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<{
    id: string;
    title: string;
    units: (BookCopy & { selected?: boolean })[];
  }[]>([]);

  const [selectedBookUnitsMenuOpen, setSelectedBookUnitsMenuOpen] = useState<string | null>(null);
  const bookUnitsMenuRef = useRef<HTMLDivElement>(null);
  const selectedBookToDisplayUnitsArrowRef = useRef<HTMLSpanElement>(null);

  useOutsideClick([selectedBookToDisplayUnitsArrowRef, bookUnitsMenuRef], () => setSelectedBookUnitsMenuOpen(null));

  const [isSuggestionsMenuOpen, setIsSuggestionsMenuOpen] = useState(false);
  const [isFiltersMenuOpen, setIsFiltersMenuOpen] = useState(false);

  const [borrowersSuggestions, setBorrowersSuggestions] = useState<BorrowerDTO[]>([]);
  const [booksSuggestions, setBooksSuggestions] = useState<Book[]>([]);

  const suggestionsMenuRef = useRef<HTMLDivElement>(null);
  const filtersMenuRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtersMenuButtonRef = useRef<HTMLButtonElement>(null);

  useOutsideClick([suggestionsMenuRef], () => setIsSuggestionsMenuOpen(false));
  useOutsideClick([filtersMenuRef, filtersMenuButtonRef], () => setIsFiltersMenuOpen(false));

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const cleanFilters = useCallback(() => {
    setSelectedBorrowers([]);
    setSelectedBooks([]);
    setStatusFilter(statusFilter_defaultOption);
    setSortBy(sortBy_defaultOption);
    setFiltersOnDefault(true);
    setOffset(0);
  }, []);

  const fetchLoans = useCallback(async () => {
    setTabStatus('loading');
    try {
      let copiesIdsArray: string[] = [];
      selectedBooks.map(b => {
        b.units.map(u => {
          if (u.selected) copiesIdsArray.push(String(u.id))
        })
      });

      const params: Record<string, any> = {
        limit,
        offset,
        sortBy,
        borrowerIds: selectedBorrowers.map((bor) => bor.id),
        copiesIds: copiesIdsArray
      };

      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await loansApi.getAll(params);
      const loansData = Array.isArray(response) ? response : (response as any).data || [];

      setLoans(loansData);
      const filteredTotal = loansData.length > 0 ? loansData[0].totalCount ?? loansData.length : 0;
      setTotalLoans(filteredTotal);
      setTabStatus('success');
    } catch (error) {
      console.error('Error fetching detailed loans:', error);
      setTabStatus('error');
    }
  }, [
    limit,
    offset,
    statusFilter,
    sortBy,
    selectedBorrowers,
    selectedBooks,
  ]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleSearch = (value: string, searchType: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!value.trim()) {
      setBooksSuggestions([]);
      setBorrowersSuggestions([]);
      setIsSuggestionsMenuOpen(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSuggestionsMenuOpen(true);
      try {
        if (searchType === 'all' || searchType === 'books') {
          const isIsbn = /^\d+(-?\d+)*$/.test(value);
          const params = isIsbn ? { isbn: value, limit: 5 } : { title: value, limit: 5 };
          const res = await booksApi.getAll(params);
          setBooksSuggestions(Array.isArray(res) ? res : (res as any).data || []);
        } else {
          setBooksSuggestions([]);
        }

        if (searchType === 'all' || searchType === 'borrowers') {
          const isDni = /^\d+$/.test(value);
          const params = isDni ? { dni: value, limit: 5 } : { name: value, limit: 5 };
          const res = await borrowersApi.getAll(params);
          setBorrowersSuggestions(Array.isArray(res) ? res : (res as any).data || []);
        } else {
          setBorrowersSuggestions([]);
        }
      } catch (error) {
        console.error('Error searching:', error);
      }
    }, 300);
  };

  const handleSuggestionSelect = async (type: 'borrower' | 'book', newSelect: any) => {
    setIsSuggestionsMenuOpen(false);

    if (type === 'borrower') {
      if (selectedBorrowers.some((bor) => bor.id === newSelect.id)) return;
      setSelectedBorrowers((prev) => [...prev, { id: newSelect.id, name: newSelect.name }]);
    } else if (type === 'book') {
      if (selectedBooks.some((b) => b.id === newSelect.id)) return;

      const copiesResponse = await booksApi.getUnits({ bookId: newSelect.id });
      const copiesWithSelected = copiesResponse.map((unit: BookCopy) => ({
        ...unit,
        selected: true
      }));

      setSelectedBooks((prev) => [
        ...prev,
        {
          id: newSelect.id,
          title: newSelect.title,
          units: copiesWithSelected
        }
      ]);
    }
    setOffset(0);
  };

  const handleSuggestionDelete = (type: 'borrower' | 'book', id: string) => {
    if (type === 'borrower') setSelectedBorrowers((prev) => prev.filter((bor) => bor.id !== id))
    else setSelectedBooks((prev) => prev.filter((b) => b.id !== id));
    setOffset(0);
  };

  const toggleCopySelect = (bookId: string, copyId: string | number) => {
    setSelectedBooks((prev) =>
      prev.map((book) => {
        if (book.id === bookId) {
          return {
            ...book,
            units: book.units.map((unit) =>
              unit.id.toString() === copyId.toString()
                ? { ...unit, selected: !unit.selected }
                : unit
            )
          };
        }
        return book;
      })
    );
  };

  const handleFilterSelect = (filter: string, value: string) => {
    setIsFiltersMenuOpen(false);

    let currentStatus = statusFilter;
    let currentSortBy = sortBy;

    if (filter === 'status') {
      setStatusFilter(value);
      currentStatus = value;
    } else if (filter === 'orderBy') {
      setSortBy(value);
      currentSortBy = value;
    }

    setFiltersOnDefault(
      currentStatus === statusFilter_defaultOption && currentSortBy === sortBy_defaultOption
    );
    setOffset(0);
  };

  const handleQuickReturnAll = async (e: React.MouseEvent, loanId: string) => {
    e.stopPropagation();
    if (!window.confirm(firstCap(t('common.areYouSure')))) return;

    try {
      await loansApi.returnBook(loanId);
      await fetchLoans();
    } catch (error) {
      console.error(`Error returning loan ${loanId}:`, error);
      setTabStatus('error');
      alert('Error al devolver el pr?stamo');
    }
  };

  const handleReturnSingleCopy = async (loanId: string, copyId: number) => {
    if (!window.confirm(firstCap(t('common.areYouSure')))) return;

    try {
      await loansApi.returnBook(loanId, [
        { copyId, returned: true, returnDate: new Date().toISOString() }
      ]);
      await fetchLoans();
    } catch (error) {
      console.error(`Error returning copy ${copyId} from loan ${loanId}:`, error);
      alert('Error al procesar la devoluci?n de la unidad');
    }
  };

  const handleLoanDelete = async (loanId: string) => {
    if (!window.confirm(firstCap(t('common.areYouSure')))) return;
    try {
      setTabStatus('loading');
      await loansApi.delete(loanId);
      await fetchLoans();
    } catch (error) {
      console.error(`Error deleting loan ${loanId}:`, error);
      setTabStatus('error');
      alert('Error al eliminar el pr?stamo');
    }
  };

  return (
    <div className="w-full flex flex-col animate-[fadeIn_200ms_ease-out] p-6 h-full overflow-x-hidden">
      <SectionHeader
        icon="library_books"
        title={firstCap(t('loans.detailedLoansPage.title'))}
        description={firstCap(t('loans.detailedLoansPage.subtitle'))}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="flex flex-row items-center text-xs font-semibold rounded-md bg-[rgb(var(--color-bg))] px-3 py-2 transition-all hover:bg-[rgb(var(--color-bg-secondary))]/50 shadow-sm"
            leftIcon={<span className="material-symbols-outlined text-md">dashboard</span>}
            onClick={() => navigate('/loans')}
          >
            <span>{firstCap(t('common.sidebar.collapse', { defaultValue: 'Volver a resumen' }))}</span>
          </Button>
          <Button
            variant="default"
            className="flex flex-row items-center bg-[rgb(var(--color-primary-500))] text-white text-xs rounded-md shadow-md hover:bg-[rgb(var(--color-primary-600))] transition-all active:scale-95"
            leftIcon={<span className="material-symbols-outlined text-md">add</span>}
            onClick={() => navigate('/loans/new')}
          >
            <span className="font-semibold">{firstCap(t('loans.registerLoan'))}</span>
          </Button>
        </div>
      </SectionHeader>

      <div className="bg-[rgb(var(--color-bg))] rounded-xl border border-[rgb(var(--color-border))]/60 p-4 flex flex-col md:flex-row gap-4 items-center justify-between relative z-11">
        <div className="flex flex-row gap-3">
          <div className="relative">
            <SearchBar
              placeholder={firstCap(t('borrowers.searchPlaceholder'))}
              onChange={(val) => handleSearch(val, searchBy)}
              className="min-w-100 h-8.75 rounded-md"
            />
            <div
              ref={suggestionsMenuRef}
              className={`absolute mt-2 w-full max-h-62.5 overflow-y-scroll bg-[rgb(var(--color-bg))] shadow-lg rounded-md transition-all duration-300 ${isSuggestionsMenuOpen && (booksSuggestions.length > 0 || borrowersSuggestions.length > 0)
                ? 'opacity-100 translate-y-0 visible'
                : 'opacity-0 -translate-y-2 invisible pointer-events-none'
                }`}
            >
              {borrowersSuggestions.length > 0 && (
                <div className="px-3 pt-3 pb-3 text-(length:--fs-caption-sm) font-bold uppercase tracking-wider text-[rgb(var(--color-primary-500))]">
                  {firstCap(t('common.roles.borrowers'))}
                </div>
              )}
              {borrowersSuggestions.map((borrower) => (
                <div
                  key={borrower.id}
                  onClick={() =>
                    handleSuggestionSelect('borrower', {
                      id: String(borrower.id),
                      name: `${borrower.firstName} ${borrower.lastName}`
                    })
                  }
                  className="flex items-center justify-between p-3 hover:bg-[rgb(var(--color-bg-secondary))] transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[rgb(var(--color-primary-500))]/10 flex items-center justify-center overflow-hidden border border-[rgb(var(--color-primary-500))]/20 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] text-lg">
                        person
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary-500))] transition-colors">
                        {`${borrower.firstName} ${borrower.lastName}`}
                      </span>
                      <span className="text-[10px] text-[rgb(var(--color-text-muted))]">
                        DNI: {(borrower as any).dni || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div
                    className={clsx({
                      'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm': true,
                      'border-emerald-500/30 text-emerald-500 bg-emerald-500/10': borrower.status === 'enabled',
                      'border-red-500/30 text-red-500 bg-red-500/10': borrower.status === 'disabled',
                      'border-amber-500/30 text-amber-500 bg-amber-500/10': borrower.status === 'withDebt'
                    })}
                  >
                    {firstCap(t(`common.statusValues.${borrower.status}` || ''))}
                  </div>
                </div>
              ))}

              {booksSuggestions.length > 0 && (
                <div className="px-3 pt-3 pb-3 border-t border-[rgb(var(--color-border))] text-(length:--fs-caption-sm) font-bold uppercase tracking-wider text-[rgb(var(--color-primary-500))]">
                  {firstCap(t('common.books'))}
                </div>
              )}
              {booksSuggestions.map((book) => (
                <div
                  key={book.id}
                  onClick={() =>
                    handleSuggestionSelect('book', {
                      id: String(book.id),
                      title: book.title
                    })
                  }
                  className="flex items-center justify-between p-3 hover:bg-[rgb(var(--color-bg-secondary))] transition-all duration-200 cursor-pointer group gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[rgb(var(--color-bg-secondary))] border border-[rgb(var(--color-border))]/50 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-xl text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-primary-500))] transition-colors">
                        menu_book
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary-500))] transition-colors line-clamp-1">
                        {book.title}
                      </span>
                      <span className="text-[10px] text-[rgb(var(--color-text-muted))]">
                        {book.author} · {book.isbn}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DropDownMenu
            label={{
              content: <span className="text-sm text-[rgb(var(--color-text-muted))]/75">{firstCap(t('common.searchBy'))}:</span>,
              position: 'left'
            }}
            className="bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text-muted))] text-xs font-medium min-w-35 p-0!"
            options={[
              { label: firstCap(t('common.all')), value: 'all' },
              { label: firstCap(t('common.roles.borrowers')), value: 'borrowers' },
              { label: firstCap(t('common.books')), value: 'books' }
            ]}
            onSelect={(val) => setSearchBy(val)}
            fontSize="12.5px"
            height="35px"
          >
            <span className="font-medium text-xs">
              {searchBy === 'all'
                ? firstCap(t('common.all'))
                : searchBy === 'borrowers'
                  ? firstCap(t('common.roles.borrowers'))
                  : firstCap(t('common.books'))}
            </span>
          </DropDownMenu>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              ref={filtersMenuButtonRef}
              variant="ghost"
              className="border border-[rgb(var(--color-border))] rounded-md"
              onClick={() => setIsFiltersMenuOpen(!isFiltersMenuOpen)}
              leftIcon={<span className="material-symbols-outlined">page_info</span>}
            >
              <span>{firstCap(t('common.filters'))}</span>
            </Button>
            <div
              ref={filtersMenuRef}
              className={`absolute flex flex-col w-[320px] mt-6 top-full left-full translate-x-full bg-[rgb(var(--color-bg))] rounded-md shadow-sm p-3 border border-[rgb(var(--color-border))] transition-all duration-300 ${isFiltersMenuOpen
                ? 'opacity-100 translate-y-0 visible'
                : 'opacity-0 -translate-y-2 invisible pointer-events-none'
                }`}
            >
              {!filtersOnDefault && (
                <div className="flex justify-end w-full mb-3">
                  <span
                    className="text-red-500 hover:text-red-400 cursor-pointer text-(length:--fs-caption)"
                    onClick={() => {
                      setIsFiltersMenuOpen(false);
                      cleanFilters();
                    }}
                  >
                    {firstCap(t('common.actions.cleanFilters'))}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 w-full mb-3">
                <DropDownMenu
                  label={{
                    content: <span className="cursor-pointer font-medium text-xs uppercase text-[rgb(var(--color-text-muted))]/75 tracking-wider">{firstCap(t('common.status'))}:</span>,
                    position: 'left'
                  }}
                  mainClassName="justify-between"
                  className="bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text-muted))] text-xs font-medium min-w-35 p-0!"
                  options={[
                    { label: firstCap(t('common.all')), value: 'all' },
                    { label: firstCap(t('common.statusValues.active')), value: 'active' },
                    { label: firstCap(t('common.statusValues.overdue')), value: 'overdue' },
                    { label: firstCap(t('common.statusValues.returned')), value: 'returned' }
                  ]}
                  onSelect={(val) => handleFilterSelect('status', val)}
                  fontSize="12.5px"
                  height="35px"
                >
                  <span className="font-medium text-xs">
                    {statusFilter === 'all'
                      ? firstCap(t('common.all'))
                      : firstCap(t(`common.statusValues.${statusFilter}`))}
                  </span>
                </DropDownMenu>
              </div>

              <div className="flex items-center gap-2 w-full">
                <DropDownMenu
                  label={{
                    content: <span className="cursor-pointer font-medium text-xs uppercase text-[rgb(var(--color-text-muted))]/75 tracking-wider">{firstCap(t('common.orderBy'))}:</span>,
                    position: 'left'
                  }}
                  mainClassName="justify-between"
                  className="bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text-muted))] text-xs font-medium min-w-40 p-0!"
                  options={orderBy_options.map((opt) => ({
                    label: firstCap(t(`loans.all.orderBy.${opt.value}`)),
                    value: opt.value
                  }))}
                  onSelect={(val) => handleFilterSelect('orderBy', val)}
                  fontSize="12.5px"
                  height="35px"
                >
                  <span className="font-medium text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">sort</span>
                    {firstCap(t(`loans.all.orderBy.${sortBy}`))}
                  </span>
                </DropDownMenu>
              </div>
            </div>
          </div>
          <div className="text-xs font-semibold text-[rgb(var(--color-text-muted))]/70 tracking-wide bg-[rgb(var(--color-bg-secondary))]/40 border border-[rgb(var(--color-border))]/40 px-3 rounded-lg flex items-center gap-2 justify-center h-9.25">
            <span className="material-symbols-outlined text-sm text-[rgb(var(--color-primary-500))]">info</span>
            <span className="text-nowrap">{firstCap(t('common.results_count', { count: totalLoans }))}</span>
          </div>
        </div>
      </div>

      <div className={`my-3 flex flex-col relative z-10 ${selectedBooks.length > 0 && selectedBorrowers.length > 0 ? 'gap-3' : ''}`}>
        <div className="flex flex-row w-full flex-wrap items-center gap-2">
          {selectedBorrowers.length > 0 && (
            <span className="text-sm text-[rgb(var(--color-text))]">{firstCap(t('loans.selectedBorrowers'))}:</span>
          )}
          {selectedBorrowers.map((bor) => (
            <div key={bor.id} className="flex items-center gap-2 bg-[rgb(var(--color-bg))] shadow-sm px-3 py-1.5 rounded-md">
              <span className="material-symbols-outlined text-[length:--fs-icon-sm] text-[rgb(var(--color-text-muted))]">person</span>
              <span className="text-sm text-[rgb(var(--color-text-muted))] font-semibold text-nowrap">{bor.name}</span>
              <span
                onClick={() => handleSuggestionDelete('borrower', bor.id)}
                className="material-symbols-outlined text-[rgb(var(--color-text-muted))] font-semibold hover:text-red-500 cursor-pointer"
              >
                close
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-row w-full flex-wrap items-center gap-2">
          {selectedBooks.length > 0 && (
            <span className="text-sm text-[rgb(var(--color-text))]">{firstCap(t('loans.selectedBooks'))}:</span>
          )}
          {selectedBooks.map((b) => (
            <div
              key={b.id} className="flex items-center gap-2 bg-[rgb(var(--color-bg))] shadow-sm px-3 py-1.5 rounded-md relative z-3">
              <span className="material-symbols-outlined text-[length:--fs-icon-sm] text-[rgb(var(--color-text-muted))]">book</span>
              <span className="text-sm text-[rgb(var(--color-text-muted))] font-semibold text-nowrap">{b.title}</span>
              {b.units.length > 0 && (
                <span
                  ref={selectedBookToDisplayUnitsArrowRef}
                  onClick={() =>
                    setSelectedBookUnitsMenuOpen(selectedBookUnitsMenuOpen === b.id ? null : b.id)
                  }
                  className={`hover:text-[rgb(var(--color-primary-500))] cursor-pointer material-symbols-outlined text-[length:--fs-icon-sm] text-[rgb(var(--color-text-muted))] transition-transform duration-200 ${selectedBookUnitsMenuOpen === b.id ? 'rotate-180' : ''
                    }`}
                >
                  chevron_left
                </span>
              )}
              <span
                onClick={() => handleSuggestionDelete('book', b.id)}
                className="material-symbols-outlined text-[rgb(var(--color-text-muted))] font-semibold hover:text-red-500 cursor-pointer"
              >
                close
              </span>

              {selectedBookUnitsMenuOpen === b.id && (
                <div
                  ref={bookUnitsMenuRef}
                  className="bg-[rgb(var(--color-bg))] shadow-sm rounded-md w-full p-3 absolute top-full left-0 mt-2 z-20 border border-[rgb(var(--color-border))] overflow-y-auto max-h-64">
                  {b.units.map((u) => (
                    <div key={u.id} className="flex flex-row items-center justify-between py-1">
                      <div className='flex items-center gap-2'>
                        <div
                          onClick={() => toggleCopySelect(b.id, u.id)}
                          className={`transition-colors duration-200 h-3.5 w-3.5 flex items-center justify-center rounded-sm cursor-pointer ${u.selected ? 'bg-[rgb(var(--color-primary-500))]' : 'border border-[rgb(var(--color-text-soft))]'
                            }`}
                        >
                          {u.selected && (
                            <span className="material-symbols-outlined text-md leading-none text-white">
                              check
                            </span>
                          )}
                        </div>
                        <span
                          onClick={() => toggleCopySelect(b.id, u.id)}
                          className="text-sm text-[rgb(var(--color-text-muted))] font-semibold text-nowrap cursor-pointer hover:text-[rgb(var(--color-primary-500))]"
                        >
                          {u.inventoryNumber}
                        </span>
                      </div>
                      <span className={`text-(length:--fs-caption-sm) font-medium rounded-full px-2 py-1 text-${u.isAvailable ? 'green-500' : 'red-500'}`}>
                        {firstCap(
                          u.isAvailable ? t('common.statusValues.available') : t('common.statusValues.unavailable')
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {tabStatus === 'error' ? (
        <ErrorState
          title={firstCap(t('common.errorMessages.error'))}
          message={firstCap(t('loans.errorLoadingLoans', { defaultValue: 'No se pudieron cargar los pr?stamos.' }))}
          retryLabel={firstCap(t('common.actions.retry'))}
          onRetry={fetchLoans}
        />
      ) : (
        <LoansTable
          className="relative z-2"
          loans={loans}
          isLoading={tabStatus === 'loading'}
          totalLoans={totalLoans}
          limit={limit}
          offset={offset}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setOffset(0);
          }}
          onOffsetChange={setOffset}
          onQuickReturnAll={handleQuickReturnAll}
          onReturnSingleCopy={handleReturnSingleCopy}
          onLoanDelete={handleLoanDelete}
          onCleanFilters={cleanFilters}
        />
      )}
    </div>
  );
}