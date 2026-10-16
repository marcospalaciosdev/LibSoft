import { useState, useRef } from 'react';
import { Button, Input } from '@/shared/components/ui';
import type { BookDTO, DataStatus } from '@Libsoft/shared-types';
import { booksApi } from '../api/books.api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { firstCap } from '@/shared/utils/firstCap';

import { TagInput } from '../components/TagInput';
import { DeweyClassificationModal } from '../components/DeweyClassificationModal';

const initialFormState: BookDTO = {
  title: 'Cien años de soledad',
  author: 'Gabriel Garcia Marquez',
  isbn: '09876544321',
  udcId: '811',
  publisher: 'Harper & Row',
  editionDate: '2026-06-06T14:30',
  description: 'Cien años de soledad descripcion',
  tags: ['cien', 'años', 'de', 'soledad'],
  topographicSubject: '823.145',
};

export function AddBookPage() {
  const [form, setForm] = useState<BookDTO>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof BookDTO, string>>>({});
  const [submitStatus, setSubmitStatus] = useState<DataStatus>('idle');
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const navigate = useNavigate();

  const [showDeweyModal, setShowDeweyModal] = useState(false);

  const [categoryLabel, setCategoryLabel] = useState('');
  const [isbnLookupStatus, setIsbnLookupStatus] = useState<DataStatus>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'year' ? (value ? Number(value) : undefined) : value,
    }));

    if (errors[name as keyof BookDTO]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitStatus('loading');
    try {
      console.log(form)
      await booksApi.create(form);
      setForm(initialFormState);
      setErrors({});
      setSubmitStatus('success');
    } catch (error: any) {
      setErrors(error.data.errors);
      console.log(error.data)
      setSubmitStatus('error');
    }
  };

  const handleISBNChange = async (value: string) => {
    const cleaned = value.replace(/[\s-]/g, "");

    if (cleaned.length === 13) {
      setIsbnLookupStatus('loading');
      try {
        const res = await fetch(`https://openlibrary.org/isbn/${cleaned}.json`);
        if (!res.ok) throw new Error("Libro no encontrado");

        const data = await res.json();

        // --- NUEVA LÓGICA PARA TAGS ---
        // OpenLibrary devuelve 'subjects', que son strings (ej: "Fiction", "Magic", etc.)
        let extractedTags: string[] = [];
        if (data.subjects && Array.isArray(data.subjects)) {
          // Tomamos los primeros 5 para no saturar el input, y los pasamos a minúsculas
          extractedTags = data.subjects
            .slice(0, 5)
            .map((s: string) => s.toLowerCase());
        }
        // ------------------------------

        let authorName = '';
        if (data.authors && data.authors.length > 0) {
          const authorRes = await fetch(`https://openlibrary.org${data.authors[0].key}.json`);
          if (authorRes.ok) {
            const authorData = await authorRes.json();
            authorName = authorData.personal_name || authorData.name || '';
          }
        }

        let yearForm: number | undefined = undefined;

        if (data.publish_date) {
          const match = data.publish_date.match(/\d{4}/);
          if (match) yearForm = parseInt(match[0], 10);
        }

        setForm(prev => ({
          ...prev,
          title: data.title || prev.title,
          publisher: (data.publishers && data.publishers.length > 0) ? data.publishers[0] : prev.publisher,
          editionDate: yearForm ? new Date(yearForm, 0, 1).toISOString().split('T')[0] : prev.editionDate,
          author: authorName || prev.author,
          tags: extractedTags.length > 0 ? extractedTags : prev.tags,
        }));

        setIsbnLookupStatus('success');
      } catch (error) {
        console.error("Error al buscar ISBN:", error);
        setIsbnLookupStatus('error');
      }
    }
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      title: value,
    }));

    if (value.trim().length === 0) {
      setShowSuggestionPanel(false);
      setSuggestions([]);
      return;
    }

    setShowSuggestionPanel(true);

    if (abortControllerRef.current) abortControllerRef.current.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?title=${value}&fields=title,author_name&limit=30&language=spa`,
        { signal: controller.signal }
      );

      if (!res.ok) throw new Error("Error en búsqueda");

      const data = await res.json();
      const titles = data.docs?.map((doc: any) => doc.title) || [];

      setSuggestions(titles);
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error(error);
    }
  };

  const optionsClassname_provisory = 'p-2 hover:bg-[rgb(var(--color-surface))] transition-colors duration-200 cursor-pointer text-[length:var(--fs-body-sm)]'

  const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
  const isBusy = submitStatus === 'loading' || isbnLookupStatus === 'loading';

  return (
    <div className='w-full h-fit p-7 flex flex-col gap-5'>
      <div className='flex flex-row justify-between'>
        <div>
          <h1 className="text-2xl font-extrabold text-[rgb(var(--color-text))] flex flex-row items-center gap-2">
            <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] text-3xl">library_books</span>
            {firstCap(t('books.AddBookPage.title'))}
          </h1>
          <p className="text-[rgb(var(--color-text-muted))]/60 mt-1 text-sm">
            {firstCap(t('books.AddBookPage.subtitle'))}
          </p>
        </div>
        {/* Actions */}
        <div className="flex justify-end items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={isBusy}
            className='rounded-md'
            onClick={() => navigate('/books')}
          >
            {firstCap(t('common.actions.cancel'))}
          </Button>
          <Button
            type="submit"
            size="md"
            isLoading={isBusy}
            onClick={handleSubmit}
            className='flex flex-row items-center py-2 px-4 h-fit bg-[rgb(var(--color-primary-500))] rounded-sm hover:bg-[rgb(var(--color-primary-600))]'
            leftIcon={
              <span className="material-symbols-outlined text-[length:--fs-body]!">
                add
              </span>
            }
          >
            {firstCap(t('books.addBook'))}
          </Button>
        </div>
      </div>
      <div className="flex flex-col justify-between gap-4 bg-[rgb(var(--color-bg))]/80 p-5 rounded-md h-fit border border-[rgb(var(--color-border))]/40">
        <Input
          id="add-book-title"
          label={<span>{firstCap(t('common.title')) + ' *'}</span>}
          name="title"
          value={form.title}
          onChange={handleTitleChange}
          placeholder={firstCap(t('books.AddBookPage.inputs.title.placeholder'))}
          error={errors?.title ? firstCap(t(`books.AddBookPage.inputs.title.errors.${errors.title}`)) : undefined}
          inputClassName='bg-[rgb(var(--color-bg-tertiary))] mb-2 border-none text-[rgb(var(--color-text))] text-sm rounded-md'
          className='relative'
        >
          {showSuggestionPanel && suggestions.length > 0 && (
            <ul className='absolute top-[110%] bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))] text-sm border border-[rgb(var(--color-border))] rounded-md shadow-sm w-full max-h-50 overflow-y-auto z-10'>
              {suggestions.map((title, index) => (
                <li
                  key={index}
                  className={optionsClassname_provisory}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, title }));
                    setShowSuggestionPanel(false);
                  }}
                >
                  <span>
                    {title}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Input>

        {/* Row 2: Author & ISBN */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="add-book-author"
            label={<span>{firstCap(t('common.author')) + ' *'}</span>}
            name="author"
            value={form.author}
            onChange={handleChange}
            placeholder={firstCap(t('books.AddBookPage.inputs.author.placeholder'))}
            error={errors?.author ? firstCap(t(`books.AddBookPage.inputs.author.errors.${errors.author}`)) : undefined}
            inputClassName='bg-[rgb(var(--color-bg-tertiary))] mb-2 border-none text-[rgb(var(--color-text))] text-sm rounded-md'
          />
          <Input
            id="add-book-isbn"
            label={<span>{firstCap(t('common.isbn')) + ' *'}</span>}
            name="isbn"
            value={form.isbn}
            onChange={(e) => {
              handleChange(e)
              handleISBNChange(e.target.value)
            }}
            placeholder={firstCap(t('books.AddBookPage.inputs.isbn.placeholder'))}
            error={errors?.isbn ? firstCap(t(`books.AddBookPage.inputs.isbn.errors.${errors.isbn}`)) : undefined}
            inputClassName='bg-[rgb(var(--color-bg-tertiary))] mb-2 border-none text-[rgb(var(--color-text))] text-sm rounded-md'
          />
        </div>

        {/* Row 3: Category & Year */}
        <div className="grid grid-cols-2 gap-4 w-full">

          <div className='flex flex-col gap-1'>
            <div className='flex flex-col gap-2.5'>
              <label
                htmlFor="open-dewey-button"
                className='cursor-pointer text-sm font-medium text-[rgb(var(--color-text-muted))] whitespace-nowrap overflow-hidden text-ellipsis min-w-0 '
              >
                {firstCap(t('common.category')) + ' *'}
              </label>
              <Button
                variant='ghost'
                type='button'
                id='open-dewey-button'
                className='bg-[rgb(var(--color-bg-tertiary))] h-10 rounded-md text-[rgb(var(--color-text))]'
                leftIcon={<span className='material-symbols-outlined text-[rgb(var(--color-primary-500))] text-(length:--fs-icon-md)'>account_tree</span>}
                onClick={() => setShowDeweyModal(true)}
              >
                <span className='text-(length:--fs-caption)'>
                  {categoryLabel ? categoryLabel : firstCap(t('books.AddBookPage.inputs.category.placeholder'))}
                </span>
              </Button>
              {errors?.udcId &&
                <p className="text-red-500 text-xs mt-1">
                  {firstCap(t(`books.AddBookPage.inputs.category.errors.${errors.udcId}`))}
                </p>}
            </div>
          </div>

          <Input
            id="add-book-year"
            label={<span>{firstCap(t('common.releaseDate')) + ' *'}</span>}
            name="editionDate"
            type="date"
            value={form.editionDate ?
              new Date(form.editionDate).toISOString().split('T')[0] :
              ''}
            onChange={handleChange}
            error={errors?.editionDate ? firstCap(t(`books.AddBookPage.inputs.editionDate.errors.${errors.editionDate}`)) : undefined}
            inputClassName='bg-[rgb(var(--color-bg-tertiary))] mb-2 border-none text-[rgb(var(--color-text))] text-sm rounded-md h-10 flex-1'
          />
        </div>

        {/* Row 4: Publisher */}

        <div className='grid grid-cols-2 gap-4'>
          <Input
            id="add-book-topographic-subject"
            label={<span>{firstCap(t('books.topographicSubject')) + ' *'}</span>}
            name="topographicSubject"
            value={form.topographicSubject ?? ''}
            onChange={handleChange}
            placeholder={firstCap(t('books.AddBookPage.inputs.topographicSubject.placeholder'))}
            error={errors?.topographicSubject ? firstCap(t(`books.AddBookPage.inputs.topographicSubject.errors.${errors.topographicSubject}`)) : undefined}
            inputClassName='bg-[rgb(var(--color-bg-tertiary))] mb-2 border-none text-[rgb(var(--color-text))] text-sm rounded-md'
          />
          <Input
            id="add-book-publisher"
            label={<span>{firstCap(t('common.editorial'))}</span>}
            name="publisher"
            value={form.publisher ?? ''}
            onChange={handleChange}
            placeholder={firstCap(t('books.AddBookPage.inputs.publisher.placeholder'))}
            inputClassName='bg-[rgb(var(--color-bg-tertiary))] mb-2 border-none text-[rgb(var(--color-text))] text-sm rounded-md'
            error={errors?.publisher ? firstCap(t(`books.AddBookPage.inputs.publisher.errors.${errors.publisher}`)) : undefined}
          />
        </div>
        {/* Row 5: Tags */}
        <TagInput
          id="add-book-tags"
          label="Tags / Keywords"
          tags={form.tags || []}
          onChange={(newTags) => setForm((prev) => ({ ...prev, tags: newTags }))}
          placeholder={firstCap(t('books.AddBookPage.inputs.tags.placeholder'))}
          inputClassName='border-none bg-[rgb(var(--color-bg-tertiary))]'
        />

        {/* Row 5: Description */}
        <Input
          inputType="textarea"
          id="add-book-description"
          name="description"
          label={<span>Descripción</span>}
          value={form.description ?? ''}
          onChange={handleChange}
          placeholder={firstCap(t('books.AddBookPage.inputs.description.placeholder'))}
          rows={3}
          inputClassName="border-none bg-[rgb(var(--color-bg-tertiary))] text-[rgb(var(--color-text))] text-sm rounded-md resize-none"
          error={errors?.description ? firstCap(t(`books.AddBookPage.inputs.description.errors.${errors.description}`)) : undefined}
        />

      </div>
      <DeweyClassificationModal
        isOpen={showDeweyModal}
        onClose={() => setShowDeweyModal(false)}
        onSelectCategory={(category_id, label) => {
          setForm((prev) => ({ ...prev, udcId: category_id }))
          setCategoryLabel(firstCap(label))
          setShowDeweyModal(false)
        }}
      />
    </div>
  );
}