import { useEffect, useRef, useState } from 'react';
import Sortable from 'sortablejs';
import {
  Button,
  Badge,
  ProgressRing,
  BarChart,
  SearchBar,
  Modal,
  Spinner,
  PaginationFooter,
} from '@/shared/components/ui';
import { SectionHeader } from "@/shared/components/layout/SectionHeader"
import { booksApi } from '../api/books.api';
import { useTranslation } from 'react-i18next';
import { firstCap } from '@/shared/utils/firstCap';
import { useNavigate } from 'react-router-dom';
import { useBooksStore } from '../store/books.store';

import { usePermissions } from '@/hooks/usePermissions';

import type {
  Book,
  BorrowedMetrics,
  CategoryFrequencyResponse,
  DataStatus
} from "@LibSoft/shared-types";
import { useOutsideClick } from '@/shared/hooks/useOutsideClick';
import { ErrorState } from '@/shared/components/feedback';

let lastValue: string;

export function BooksPage() {
  const navigate = useNavigate();

  const { Permission } = usePermissions();

  const { searchQuery } = useBooksStore();

  const [books, setBooks] = useState<Book[]>([]);

  const [booksTabStatus, setBooksTabStatus] = useState<DataStatus>('loading');

  const [plotsSections, setPlotSectionsToggle] = useState(true);

  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isLoanWarningModalOpen, setIsLoanWarningModalOpen] = useState(false);

  const [loanWarningBook, setLoanWarningBook] = useState<Book | null>(null);
  const tableRef = useRef<HTMLTableSectionElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);

  const searchBarRef = useRef<HTMLDivElement>(null);

  const [emptyTableHeight, setEmptyTableHeight] = useState(200);

  const [bookAmount, setBookAmount] = useState<number | null>(null);

  const [categoriesFrecuency, setCategoriesFrecuency] = useState<CategoryFrequencyResponse[]>([]);
  const [categoriesFrecuencyStatus, setCategoriesFrecuencyStatus] = useState<DataStatus>('idle');

  const [borrowedMetrics, setBorrowedMetrics] = useState<BorrowedMetrics>();
  const [borrowedMetricsStatus, setBorrowedMetricsStatus] = useState<DataStatus>('idle');

  const [limit, setLimit] = useState<number>(25);
  const [offset, setOffset] = useState<number>(0);

  const { t, i18n } = useTranslation();

  const { setSearchQuery } = useBooksStore();
  const [searchOpen, setSearchOpen] = useState(false);

  const getBorrowedMetrics = async () => {
    try {
      setBorrowedMetricsStatus('loading');
      const data = await booksApi.getBorrowedMetrics();
      setBorrowedMetrics(data);
      setBorrowedMetricsStatus('success')
    } catch (error) {
      console.error("Error al obtener el porcentaje de libros prestados:", error);
      setBorrowedMetricsStatus('error')
    }
  }

  useEffect(() => { getBorrowedMetrics() }, []);
  useOutsideClick([searchBarRef], () => setSearchOpen(false))

  const getCategoriesFrecuency = async () => {
    try {
      setCategoriesFrecuencyStatus('loading');
      const data = await booksApi.getCategoriesFrecuency({
        lang: i18n.language as string,
        limit: '7'
      });

      setCategoriesFrecuency(data as any);
      setCategoriesFrecuencyStatus('success');
    } catch (error) {
      console.error("Error al obtener la frecuencia de las categorías:", error);
      setCategoriesFrecuencyStatus('error');
    }
  }

  useEffect(() => { getCategoriesFrecuency() }, []);

  const booksToDisplay = books;

  useEffect(() => {
    const fetchBooksAmount = async () => {
      try {
        const data = await booksApi.getAmount();
        setBookAmount(data as any);
      } catch (error) {
        console.error("Error al obtener la cantidad de libros:", error);
      }
    };

    fetchBooksAmount();
  }, []);

  useEffect(() => {
    if (!tableRef.current) return;

    const sortable = Sortable.create(tableRef.current, {
      animation: 150,
      handle: '.drag-handle',
      disabled: searchQuery !== '',
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt;
        if (oldIndex === undefined || newIndex === undefined) return;

        setBooks((prev) => {
          const items = [...prev];
          const [movedItem] = items.splice(oldIndex, 1);
          items.splice(newIndex, 0, movedItem);
          return items;
        });
      },
    });

    return () => {
      sortable.destroy();
    };
  }, [searchQuery]);

  useEffect(() => {
    const calculateHeight = () => {
      if (tableContainerRef.current && theadRef.current) {
        const containerHeight = tableContainerRef.current.clientHeight;
        const theadHeight = theadRef.current.clientHeight;

        setEmptyTableHeight(Math.max(200, containerHeight - theadHeight));
      }
    };

    const observer = new ResizeObserver(calculateHeight);
    if (tableContainerRef.current) {
      observer.observe(tableContainerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const fetchBooks = async (
    title?: string,
    category?: string
  ) => {

    setBooksTabStatus('loading');
    try {
      const data = await booksApi.getAll({
        limit: limit,
        offset: offset,
        sortBy: 'id',
        order: 'DESC',
        title: title || '',
        categoryId: category && !isNaN(Number(category)) ? Number(category) : undefined,
        lang: i18n.language
      });

      setBooks(data as any);
      setBooksTabStatus('success');
    } catch (error) {
      console.error('Error al obtener los libros:', error);
      setBooksTabStatus('error');
    }
  };

  const handleSearchQuery = (value: string) => {

    if (value.trim().length > 0) setSearchQuery(value);
    else if (value.trim().length === 0 && lastValue !== '') setSearchQuery('')
    lastValue = value;
  }

  useEffect(() => {
    setOffset(0);
    fetchBooks(searchQuery);
  }, [searchQuery, limit]);

  useEffect(() => { fetchBooks(searchQuery) }, [offset]);

  const handleDeleteBook = (book: Book) => {
    const borrowed = Number(book.borrowedCopies ?? 0);
    if (borrowed > 0) {

      setLoanWarningBook(book);
      setIsLoanWarningModalOpen(true);
      return;
    }
    setBookToDelete(book);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;

    try {
      await booksApi.delete(bookToDelete.id);
      setBooks((prev) => prev.filter((book) => book.id !== bookToDelete.id));
    } catch (error) {
      console.error('Error al eliminar el libro:', error);
    } finally {
      setIsDeleteModalOpen(false);
      setBookToDelete(null);
    }
  };

  const cancelDeleteBook = () => {
    setIsDeleteModalOpen(false);
    setBookToDelete(null);
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden p-6 relative animate-fade-in">
      <SectionHeader
        icon='book_5'
        title={firstCap(t('books.section'))}
        description={firstCap(t('books.description'))}
        className='pb-5'
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Button
              variant="default"
              onClick={() => setSearchOpen((s) => !s)}
              aria-label="Search"
              className="p-2 rounded-md hover:bg-[rgb(var(--color-surface))] text-(length:--fs-icon-md)"
            >
              <span className="material-symbols-outlined text-[rgb(var(--color-text))]">search</span>
            </Button>
            {searchOpen && (
              <div
                ref={searchBarRef}
                className="absolute right-0 mt-2 w-lg bg-[rgb(var(--color-bg-secondary))] p-2 rounded-md shadow-lg z-20">
                <SearchBar
                  placeholder={firstCap(t('books.searchPlaceholder'))}
                  onChange={(value) => handleSearchQuery(value)}
                  className="w-full text-(length:--fs-body-sm) rounded-sm"
                />
              </div>
            )}
          </div>

          <Permission permissions='books.create'>
            <Button
              size="sm"
              className='flex flex-row items-center py-1.5 px-3 h-fit bg-[rgb(var(--color-primary-500))] rounded-sm hover:bg-[rgb(var(--color-primary-600))]'
              leftIcon={<span className='material-symbols-outlined text-(length:--fs-body)!'>add</span>}
              onClick={() => { navigate('/books/add') }}
            >
              <span className='text-(length:--fs-caption)!'>{firstCap(t('books.addBook'))}</span>
            </Button>
          </Permission>
        </div>
      </SectionHeader>
      <div
        className={`grid transition-all duration-300 ease-in-out ${plotsSections ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 mb-0 pointer-events-none'
          }`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="flex flex-row gap-5 w-full">
            <div className='overflow-hidden bg-[rgb(var(--color-bg))] rounded-2xl border border-[rgb(var(--color-border))]/40 p-4 w-[35%] relative'>
              {borrowedMetricsStatus === 'loading' ? (
                <Spinner
                  color='rgb(var(--color-primary-500))'
                  className='w-full h-full'
                />
              ) : borrowedMetricsStatus === 'error' ? (
                <ErrorState
                  message={firstCap(t('books.errors.failedToGetBorrowedMetrics'))}
                  onRetry={
                    getBorrowedMetrics
                  }
                  retryLabel={firstCap(t('common.actions.retry'))}
                />
              ) : borrowedMetricsStatus === 'success' ? (
                <>
                  <div className=''>
                    <h2 className='text-[rgb(var(--color-text))] font-bold text-(length:--fs-caption-sm) uppercase'>
                      {firstCap(t('common.availability'))}
                    </h2>
                  </div>
                  <ProgressRing
                    progress={borrowedMetrics?.borrowedPercentage || 0} showLegend
                    primaryLabel={firstCap(t('common.borrowed_one')) + ` (${borrowedMetrics?.borrowedCopies || '?'})`}
                    secondaryLabel={firstCap(t('common.stock')) + ` (${borrowedMetrics?.availableCopies || '?'})`} className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                  >
                    <span className='text-[rgb(var(--color-text))] font-extrabold text-2xl'>{Math.round(borrowedMetrics?.borrowedPercentage || 0)}%</span>
                    <span className='text-[rgb(var(--color-text-muted))]/60 text-(length:--fs-caption-sm) uppercase'>{firstCap(t('common.borrowed_other', { count: borrowedMetrics?.borrowedCopies || 0 }))}</span>
                  </ProgressRing>
                </>
              ) : null}
            </div>

            <div className='overflow-hidden bg-[rgb(var(--color-bg))] rounded-2xl border border-[rgb(var(--color-border))]/40 p-4 w-[64%] h-51.25 flex flex-col gap-6'>
              {categoriesFrecuencyStatus === 'loading' ? (
                <div className='w-full h-full flex items-center justify-center'>
                  <Spinner />
                </div>
              ) : categoriesFrecuencyStatus === 'error' ? (
                <ErrorState
                  message={firstCap(t('books.errors.failedToGetCategoriesFrecuency'))}
                  onRetry={getCategoriesFrecuency}
                  retryLabel={firstCap(t('common.actions.retry'))}
                />
              ) : categoriesFrecuencyStatus === 'success' ? (
                <>
                  <h2 className='text-[rgb(var(--color-text))] font-bold text-(length:--fs-caption-sm) uppercase flex flex-row items-center justify-between'>
                    <span>
                      {firstCap(t('books.byCategory'))}
                    </span>
                    <span>
                      {firstCap(t('common.total') + ': ' + bookAmount)}
                    </span>
                  </h2>
                  <BarChart height={90}
                    data={categoriesFrecuency?.map((category) => ({
                      label: firstCap(category.categoryName),
                      values: [category.booksAmount],
                    }))}
                    datasets={[
                      { label: firstCap(t('common.books')), color: 'rgb(var(--color-primary-500))' },
                    ]}
                    yAxisLabel={firstCap(t('common.count'))}
                    showLegend={true}
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div onClick={() => setPlotSectionsToggle(!plotsSections)} className={`z-12 mx-auto cursor-pointer transition-all duration-300 rounded-md relative ${plotsSections ? 'my-2 translate-y-0' : '-mt-10 mb-0 -translate-y-5'}`}>
        <span
          className='material-symbols-outlined text-[rgb(var(--color-text))] text-(length:--fs-icon-md) hover:text-[rgb(var(--color-primary-500))] hover:bg-[rgb(var(--color-surface))] rounded-sm p-2 transition-all duration-200'>
          {plotsSections ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
        </span>
      </div>

      {/* Books Table */}
      {booksTabStatus === 'loading' ? (
        <div className='flex-1 flex justify-center items-center bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))]/40 rounded-md overflow-hidden'>
          <Spinner />
        </div>
      ) : booksTabStatus === 'error' ? (
        <div className='flex-1 bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))]/40 rounded-md overflow-hidden'>
          <ErrorState
            title={firstCap(t('common.errorMessages.error'))}
            message={firstCap(t('books.errorLoadingBooks', { defaultValue: 'No se pudieron cargar los libros.' }))}
            retryLabel={firstCap(t('common.actions.retry'))}
            onRetry={() => fetchBooks(searchQuery)}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col w-full border border-[rgb(var(--color-border))]/40 rounded-md overflow-hidden">
          {/* Scroll area */}
          <div ref={tableContainerRef} className="w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-[rgb(var(--color-bg))]">
            <table className="w-full bg-[rgb(var(--color-bg))]">
              <thead ref={theadRef}>
                <tr className="bg-[rgb(var(--color-bg-secondary))] sticky top-0 z-10">
                  <th className="w-10 px-4 py-3"></th>
                  <th className="text-left pr-6 py-3 text-xs font-medium text-[rgb(var(--color-text-muted))]/60 uppercase tracking-wider w-75">
                    {firstCap(t('common.title'))}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[rgb(var(--color-text-muted))]/60 uppercase tracking-wider max-w-62.5">
                    {firstCap(t('common.author'))}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[rgb(var(--color-text-muted))]/60 uppercase tracking-wider">
                    ISBN
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-[rgb(var(--color-text-muted))]/60 uppercase tracking-wider text-left">
                    {firstCap(t('common.category'))}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[rgb(var(--color-text-muted))]/60 uppercase tracking-wider">
                    {firstCap(t('common.statusValues.available'))}
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-[rgb(var(--color-text-muted))]/60 uppercase tracking-wider">
                    {firstCap(t('common.actions.actions'))}
                  </th>
                </tr>
              </thead>
              <tbody ref={tableRef} className="bg-[rgb(var(--color-bg))]">
                {booksToDisplay.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ height: `${emptyTableHeight}px` }}>
                      <div className='flex flex-col items-center justify-center w-full h-full gap-1 min-h-50'>
                        <span className='material-symbols-outlined text-white bg-[rgb(var(--color-primary-500))]/60 p-2 rounded-sm text-5xl mb-4'>
                          book
                        </span>
                        <span className='text-[rgb(var(--color-text))]/60 text-(length:--fs-body-lg) uppercase'>
                          {firstCap(t('books.emptyTable.title'))}
                        </span>
                        <span className='text-[rgb(var(--color-text))]/60 text-(length:--fs-caption)'>
                          {firstCap(t('books.emptyTable.subtitle'))}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  booksToDisplay.map((book) => {
                    const total = Number(book.totalCopies ?? 0);
                    const borrowed = Number(book.borrowedCopies ?? 0);
                    const available = Math.max(0, total - borrowed);
                    let variant: 'success' | 'warning' | 'error' = 'success';
                    if (total === 0 || available === 0) {
                      variant = 'error';
                    } else {
                      const ratio = available / total;
                      if (ratio <= 0.2) variant = 'error';
                      else if (ratio <= 0.5) variant = 'warning';
                      else variant = 'success';
                    }

                    return (
                      <tr key={book.id} className="bg-[rgb(var(--color-bg))] cursor-pointer hover:bg-[rgb(var(--color-bg-secondary))] transition-colors border-b border-[rgb(var(--color-border))]">
                        <td className="w-10 px-6 py-3 text-center align-middle">
                          <span
                            className={`material-symbols-outlined text-[rgb(var(--color-text-muted))]/50 transition-colors select-none ${searchQuery !== ''
                              ? 'opacity-30 cursor-not-allowed'
                              : 'cursor-grab active:cursor-grabbing hover:text-[rgb(var(--color-text))] drag-handle'
                              }`}
                          >
                            drag_indicator
                          </span>
                        </td>
                        <td className="py-2 pr-6 w-75 text-sm font-medium text-[rgb(var(--color-text))]">{firstCap(book.title)}</td>
                        <td className="px-6 text-sm text-[rgb(var(--color-text-muted))] truncate">{firstCap(book.author)}</td>
                        <td className="px-6 text-sm text-[rgb(var(--color-text-muted))]/60 font-mono">{book.isbn}</td>
                        <td className="px-6">
                          <Badge
                            variant='info'
                          >
                            <span className='text-nowrap overflow-hidden text-ellipsis max-w-37.5'>{firstCap(book.category ?? '')}</span>
                          </Badge>
                        </td>
                        <td className="px-6">
                          <Badge variant={variant}>
                            {available}/{total}
                          </Badge>
                        </td>
                        <td className="">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => navigate(`/books/manage/${book.id}/edit`)}
                              className="aspect-square p-1.5! rounded-md text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-500))] hover:bg-[rgb(var(--color-primary-500))]/10 transition-all duration-200 flex items-center justify-center cursor-pointer"
                              tooltip={{ text: firstCap(t('books.actions.editBook')), fontSize: 10 }}
                            >
                              <span className="material-symbols-outlined text-(length:--fs-body)">edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleDeleteBook(book)}
                              className="aspect-square p-1.5! rounded-md text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-error-500))] hover:bg-[rgb(var(--color-error-500))]/20 transition-all duration-200 flex items-center justify-center cursor-pointer"
                              tooltip={{ text: firstCap(t('books.actions.deleteBook')), fontSize: 10 }}
                            >
                              <span className="material-symbols-outlined text-(length:--fs-body)">delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <PaginationFooter
            totalItems={bookAmount ?? 0}
            limit={limit}
            offset={offset}

            onPageChange={(offset) => { setOffset(offset) }}
            onLimitChange={(limit) => { setLimit(limit); setOffset(0); }}

            limitOptions={[1, 25, 50, 100, 200]}

            resultsCountText={() =>
              firstCap(t('common.results_count', { count: bookAmount ?? 0 }))
            }
            resultsPerPageLabel={
              <span className='text-(length:--fs-caption) text-[rgb(var(--color-text-muted))]'>
                {firstCap(t('common.resultsPerPage'))}
              </span>
            }
          />
        </div>
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={cancelDeleteBook}
        title={firstCap(t('common.actions.delete'))}
      >
        <div className="w-full bg-[rgb(var(--color-bg))] flex flex-col items-center p-8 rounded-2xl relative">
          <div className="mt-4 mb-8 relative">
            <div className="absolute inset-0 bg-[rgb(var(--color-error-500))]/10 rounded-full scale-150 animate-pulse"></div>
            <div className="relative bg-[rgb(var(--color-error-500))]/20 p-5 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[rgb(var(--color-error-500))] text-5xl select-none">
                delete_forever
              </span>
            </div>
          </div>

          <h2 className="text-[rgb(var(--color-text))] text-2xl font-bold mb-3 text-center tracking-tight">
            {firstCap(t('common.areYouSure'))}
          </h2>
          <p className="text-[rgb(var(--color-text-muted))]/80 text-sm text-center leading-relaxed w-[90%]">
            {bookToDelete ? `Eliminar "${bookToDelete.title}" eliminará los registros de sus copias en todos los préstamos que lo contengan. Esta acción no se puede deshacer.` : 'Eliminar el libro eliminará los registros de sus copias en todos los préstamos que lo contengan.'}
          </p>

          <div className="mt-8 flex w-full gap-3">
            <Button
              variant="danger"
              className="w-full h-12 rounded-xl font-semibold text-[rgb(var(--color-text-muted))]"
              onClick={cancelDeleteBook}
            >
              {firstCap(t('common.actions.cancel'))}
            </Button>
            <Button
              variant="default"
              className="w-full h-12 rounded-xl font-bold bg-red-600/80 text-white hover:bg-red-600 hover:text-white shadow-[rgb(var(--color-error-500))]/20 transition-all duration-200 transform active:scale-[0.98]"
              onClick={confirmDeleteBook}
            >
              {firstCap(t('common.actions.delete'))}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isLoanWarningModalOpen}
        onClose={() => { setIsLoanWarningModalOpen(false); setLoanWarningBook(null); }}
        title={firstCap(t('common.actions.delete'))}
        maxWidth='md'
      >
        <div className="w-full bg-[rgb(var(--color-bg))] flex flex-col items-center p-8 rounded-2xl relative">
          <div className="mt-4 mb-8 relative">
            <div className="absolute inset-0 bg-amber-500/10 rounded-full scale-150 animate-pulse"></div>
            <div className="relative bg-amber-500/20 p-5 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-500 text-5xl select-none">
                warning
              </span>
            </div>
          </div>

          <h2 className="text-[rgb(var(--color-text))] text-2xl font-bold mb-3 text-center tracking-tight">
            {firstCap(t('books.cannotDeleteBookModal.title'))}
          </h2>
          <div className="text-[rgb(var(--color-text-muted))]/80 text-sm text-center leading-relaxed w-[90%] flex flex-col">
            <span>
              {firstCap(loanWarningBook?.title ?? "") + " "}
              {loanWarningBook?.borrowedCopies === 1 ? t('books.cannotDeleteBookModal.is_loaned_message_one') : t('books.cannotDeleteBookModal.is_loaned_message_other', { count: loanWarningBook?.borrowedCopies })}
            </span>

            <span>
              {firstCap(t('books.cannotDeleteBookModal.return_copies_message'))}
            </span>
          </div>

          <div className="mt-8 justify-center flex w-full gap-3">
            <Button
              variant="ghost"
              className="h-12 rounded-xl font-semibold"
              onClick={() => { setIsLoanWarningModalOpen(false); setLoanWarningBook(null); }}
            >
              {firstCap(t('common.actions.accept'))}
            </Button>
          </div>
        </div>
      </Modal>
    </div >
  );
}