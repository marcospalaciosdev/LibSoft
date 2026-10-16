import { useState, useEffect, useRef, type UIEvent } from 'react';
import { Modal, Button, Input } from '@/shared/components/ui';
import { booksApi } from '@/features/books/api/books.api';
import { useTranslation } from 'react-i18next';
import { firstCap } from '@/shared/utils/firstCap';

import type { DeweyClassificationDto } from '@LibSoft/shared-types';

import { SelectCase } from '@/shared/components/ui/SelectCase';

interface DeweyClassificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category_id: string, label: string) => void;
}

type MainDeweyClassification = {
  id: string;
  label: string;
  range: { min: string | undefined; max: string | undefined };
};

const classificationStatusesClassName: Record<DeweyClassificationDto['status'], string> = {
  in_use: 'bg-[rgb(var(--color-primary-500))]/10 text-[rgb(var(--color-primary-500))] border border-[rgb(var(--color-primary-500))]/20',
  discontinued: 'bg-[rgb(var(--color-error-500))]/10 text-[rgb(var(--color-error-500))] border border-[rgb(var(--color-error-500))]/20',
  unassigned: 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
}

const mainCategories: MainDeweyClassification[] = [
  { id: 'all', label: 'Todos', range: { min: '000', max: '999' } },
  { id: '000-099', label: '000 - Generalidades e Informatica', range: { min: '000', max: '099' } },
  { id: '100-199', label: '100 - Filosofia y Psicologia', range: { min: '100', max: '199' } },
  { id: '200-299', label: '200 - Teologia', range: { min: '200', max: '299' } },
  { id: '300-399', label: '300 - Ciencias Sociales', range: { min: '300', max: '399' } },
  { id: '400-499', label: '400 - Lenguas', range: { min: '400', max: '499' } },
  { id: '500-599', label: '500 - Ciencias Naturales y Matematicas', range: { min: '500', max: '599' } },
  { id: '600-699', label: '600 - Tecnologia', range: { min: '600', max: '699' } },
  { id: '700-799', label: '700 - Bellas Artes y Recreación', range: { min: '700', max: '799' } },
  { id: '800-899', label: '800 - Literatura', range: { min: '800', max: '899' } },
  { id: '900-999', label: '900 - Geografia e Historia', range: { min: '900', max: '999' } },
];

const ITEMS_PER_PAGE = 30;

export function DeweyClassificationModal({ isOpen, onClose, onSelectCategory }: DeweyClassificationModalProps) {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<DeweyClassificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [total, setTotal] = useState<number>(0);

  const [search, setSearch] = useState<string>('');
  const [includeDiscontined, setIncludeDiscontinued] = useState<boolean>(false);
  const [includeUnassigned, setIncludeUnassigned] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const listContainerRef = useRef<HTMLDivElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<MainDeweyClassification>({
    id: 'all',
    label: 'Todos',
    range: { min: undefined, max: undefined },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;
    setPage(1);
    setHasMore(true);
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
  }, [isOpen, i18n.language, selectedCategory, debouncedSearch, includeUnassigned, includeDiscontined]);


  const fetchDewey = async (pageNum: number) => {
    if (!isOpen) return;

    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await booksApi.getDeweyClassifications({
        lang: i18n.language,
        searchTerm: debouncedSearch.trim() || undefined,
        min: selectedCategory.range.min,
        max: selectedCategory.range.max,
        includeUnassigned: includeUnassigned,
        includeDiscontinued: includeDiscontined,

        page: pageNum,
        limit: ITEMS_PER_PAGE,
      });

      if (pageNum === 1) setData(res);
      else setData((prev) => [...prev, ...res]);

      if (res.length < ITEMS_PER_PAGE) setHasMore(false);
      else setHasMore(true);

    } catch (err) {
      console.error('Error al obtener la clasificación Dewey:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchDeweyAmount = async () => {
    try {
      const res = await booksApi.getDeweyClassificationsAmount({
        lang: i18n.language,
        searchTerm: debouncedSearch.trim() || undefined,
        min: selectedCategory.range.min,
        max: selectedCategory.range.max,
        includeUnassigned: includeUnassigned,
        includeDiscontinued: includeDiscontined,
      });
      setTotal(res);
    } catch (err) {
      console.error('Error al obtener la cantidad de clasificaciones Dewey:', err);
    }
  };

  useEffect(() => {
    fetchDewey(page);
  }, [
    isOpen,
    page,
    i18n.language,
    selectedCategory,
    debouncedSearch,
    includeUnassigned,
    includeDiscontined
  ]);

  useEffect(() => {
    if (!isOpen) return;

    fetchDeweyAmount();
  }, [
    isOpen,
    includeDiscontined,
    includeUnassigned,
    debouncedSearch,
    selectedCategory,
    i18n.language
  ]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    if (scrollHeight - scrollTop - clientHeight < 20 && !loading && !loadingMore && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const filteredData = data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={firstCap(t('books.deweyModal.title'))}
      maxWidth="4xl"
    >
      <div className="flex flex-col gap-4 p-6 pt-4 h-150">
        <div className="w-full">
          <Input
            id="dewey-search"
            placeholder={firstCap(t('books.deweyModal.searchPlaceholder'))}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
            inputClassName="bg-[rgb(var(--color-bg-secondary))] text-sm rounded-md"
            onClearError={() => { }}
          />
        </div>

        <div className='w-full overflow-hidden flex flex-col gap-3'>
          <div className='w-ful flex flex-row gap-4'>
            <SelectCase
              onClick={(value) => {
                setIncludeUnassigned(value);
              }}
              label={
                <span className='text-[rgb(var(--color-text-muted))] text-(length:--fs-caption)'>Incluir no asignados</span>
              }
              defaultIsActive={includeUnassigned}
            />
            <SelectCase
              onClick={(value) => {
                setIncludeDiscontinued(value);
              }}
              label={
                <span className='text-[rgb(var(--color-text-muted))] text-(length:--fs-caption)'>Incluir descontinuados</span>
              }
              defaultIsActive={includeDiscontined}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[rgb(var(--color-border))] scrollbar-track-transparent">
            {mainCategories.map((cat) => (
              <Button
                variant='default'
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all whitespace-nowrap cursor-pointer ${selectedCategory.id === cat.id
                  ? 'bg-[rgb(var(--color-primary-500))] text-white border-[rgb(var(--color-primary-500))]'
                  : 'bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-muted))] border-[rgb(var(--color-border))]/50 hover:bg-[rgb(var(--color-bg-hover))]'
                  }`}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Classification List with Infinite Scroll */}
        <div
          ref={listContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto border border-[rgb(var(--color-border))]/30 rounded-lg h-75 bg-[rgb(var(--color-bg-secondary))]/30 scrollbar-thin"
        >
          {loading && page === 1 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[rgb(var(--color-text-muted))] h-full">
              <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-[rgb(var(--color-primary-500))]">
                sync
              </span>
              <p className="text-sm">Cargando clasificación dewey...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[rgb(var(--color-text-muted))] h-full">
              <span className="material-symbols-outlined text-4xl mb-2">
                search_off
              </span>
              <p className="text-sm">No se encontraron resultados para tu búsqueda.</p>
            </div>
          ) : (
            <div className="divide-y divide-[rgb(var(--color-border))]/20">
              {filteredData.map((item) => (
                <div
                  key={item.code}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-[rgb(var(--color-bg-hover))] transition-colors cursor-pointer"
                  onClick={() => onSelectCategory(item.code, item.name)}
                >
                  <span className={`px-2.5 py-1 text-xs font-bold font-mono tracking-wider rounded w-12 text-center ${classificationStatusesClassName[item.status]}`}>
                    {item.code}
                  </span>
                  <span className="text-sm text-[rgb(var(--color-text))] font-medium">
                    {firstCap(item.name)}
                  </span>
                </div>
              ))}

              {/* Spinner indicador en la parte inferior mientras carga más elementos */}
              {loadingMore && (
                <div className="flex justify-center items-center py-4 border-t border-[rgb(var(--color-border))]/10 gap-2 text-xs text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-bg-secondary))]/10">
                  <span className="material-symbols-outlined animate-spin text-lg text-[rgb(var(--color-primary-500))]">
                    sync
                  </span>
                  <span>Cargando más registros...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex justify-between items-center text-xs text-[rgb(var(--color-text-muted))]/60 border-t border-[rgb(var(--color-border))]/20 pt-4 mt-1">
          <span>{total > 0 ? (loading || loadingMore ? '...' : filteredData.length) : 0} / {total} {firstCap(t('common.records'))}</span>
          <span>{firstCap(t(`common.language`))}: {firstCap(t(`language.${i18n.language}`))}</span>
        </div>
      </div>
    </Modal>
  );
}