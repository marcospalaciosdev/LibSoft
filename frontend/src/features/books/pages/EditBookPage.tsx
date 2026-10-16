import { useEffect, useState } from "react";
import { booksApi } from "../api/books.api";
import type { BookDTO, EditBookDTO, DataStatus } from "@Libsoft/shared-types";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button, Input, Spinner } from "@/shared/components/ui";
import { ErrorState } from "@/shared/components/feedback";
import { useTranslation } from "react-i18next";
import { firstCap } from "@/shared/utils/firstCap";
import { TagInput } from "../components/TagInput";
import { DeweyClassificationModal } from "../components/DeweyClassificationModal";
import i18n from "@/locales/i18n";

export function EditBookPage() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [pageStatus, setPageStatus] = useState<DataStatus>('loading');
    const [saveDataStatus, setSaveDataStatus] = useState<DataStatus>('idle');

    const [book, setBook] = useState<BookDTO | undefined>(undefined);

    const [form, setForm] = useState<EditBookDTO | undefined>(undefined);

    const [errors, setErrors] = useState<Partial<Record<keyof EditBookDTO, string>>>({});

    const [categoryLabel, setCategoryLabel] = useState<string>('');

    const [showDeweyModal, setShowDeweyModal] = useState(false);

    const normalizeBookToForm = (bookData: Partial<BookDTO> | any): EditBookDTO => ({
        title: bookData?.title ?? '',
        author: bookData?.author ?? '',
        isbn: bookData?.isbn ?? '',
        udcId: bookData?.udcId ?? bookData?.deweyCategoryId ?? bookData?.dewey_category_id ?? bookData?.categoryId ?? bookData?.category_id ?? bookData?.deweyClassification?.code ?? '',
        publisher: bookData?.publisher ?? '',
        editionDate: bookData?.editionDate
            ? String(bookData.editionDate).slice(0, 10)
            : bookData?.publishedDate
                ? String(bookData.publishedDate).slice(0, 10)
                : bookData?.edition_date
                    ? String(bookData.edition_date).slice(0, 10)
                    : '',
        description: bookData?.description ?? '',
        tags: Array.isArray(bookData?.tags) ? bookData.tags : [],
        topographicSubject: bookData?.topographicSubject ?? bookData?.topographic_subject ?? '',
    });

    const fetchBook = async () => {
        if (!id) {
            setPageStatus('error');
            return;
        }
        try {
            setPageStatus('loading');
            const response: any = await booksApi.getById(id, i18n.language);
            const normalizedForm = normalizeBookToForm(response);
            const deweyName = response?.deweyClassification?.label
                ?? response?.deweyClassification?.name
                ?? response?.dewey_classification?.label
                ?? response?.dewey_classification?.name
                ?? response?.category
                ?? '';

            setBook(response as BookDTO);
            setForm(normalizedForm);
            setCategoryLabel(String(deweyName));
            setPageStatus('success');
        } catch (error) {
            console.error('Error al obtener el libro:', error);
            setPageStatus('error');
        }
    };

    useEffect(() => {
        console.log(book);
    }, [book])

    const clearFieldError = (field: keyof EditBookDTO) => () => {
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;

        setForm((prev) => {
            if (prev) {
                return {
                    ...prev,
                    [name]: name === 'editionDate' ? value : value,
                };
            }
            return prev;
        });
    };

    const handleSave = async () => {
        if (!id || !form) return;
        try {
            setSaveDataStatus('loading');
            const payload = {
                title: form?.title,
                author: form?.author,
                isbn: form?.isbn,
                udcId: form?.udcId,
                publisher: form?.publisher,
                topographicSubject: form?.topographicSubject,
                description: form?.description,
                editionDate: form?.editionDate,
                tags: form?.tags,
            };
            await booksApi.update(id, payload);
            setSaveDataStatus('success');
            navigate('/books');
        } catch (error: any) {
            setErrors(error.data.errors);
            setSaveDataStatus('error');
        }
    };

    useEffect(() => {
        fetchBook();
    }, [id]);

    const categoryDisplayValue = form?.udcId
        ? `${form.udcId}${categoryLabel ? ` - ${categoryLabel}` : ''}`
        : categoryLabel || firstCap(t('books.manage.edit.additionalDetails.inputs.category.placeholder'));

    return (
        <>
            {pageStatus === 'loading' ? (
                <div className="h-full flex items-center justify-center">
                    <Spinner
                        size="md"
                    />
                </div>
            ) : pageStatus === 'error' ? (
                <ErrorState
                    title={firstCap(t('common.errorMessages.error'))}
                    message={firstCap(t('books.manage.edit.errorLoadingBook', { defaultValue: 'No se pudo cargar el libro.' }))}
                    retryLabel={firstCap(t('common.actions.retry'))}
                    onRetry={fetchBook}
                />
            ) : pageStatus === 'success' && book && form ? (
                <div className="w-full h-full flex flex-col animate-fade-in">
                    <div className="absolute flex flex-row gap-2 top-6 right-6">
                        <Button
                            variant="ghost"
                            className="rounded-md font-medium px-4"
                            disabled={saveDataStatus === 'loading'}
                            onClick={() => navigate("/books")}
                        >
                            {firstCap(t('books.manage.edit.discard'))}
                        </Button>
                        <Button type="button" isDisabled={saveDataStatus === 'loading'} isLoading={saveDataStatus === 'loading'} onClick={handleSave} className="rounded-md font-medium px-6 bg-[rgb(var(--color-primary-500))] text-white hover:bg-[rgb(var(--color-primary-600))] shadow-sm">
                            {firstCap(t('books.manage.edit.save'))}
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-[rgb(var(--color-bg))] rounded-lg p-6 border border-[rgb(var(--color-border))] ">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] select-none">
                                    edit_document
                                </span>
                                <h2 className="text-base font-bold text-[rgb(var(--color-text))]">
                                    {firstCap(t('books.manage.edit.mainInfo.title'))}
                                </h2>
                            </div>

                            <div className="flex flex-col gap-5">
                                <Input
                                    name="title"
                                    placeholder={firstCap(t('books.manage.edit.mainInfo.inputs.title.placeholder'))}
                                    label={<span>{firstCap(t('books.manage.edit.mainInfo.inputs.title.label'))}</span>}
                                    value={form?.title}
                                    onChange={handleFormChange}
                                    onClearError={clearFieldError('title')}
                                    error={errors.title && firstCap(t(`books.manage.edit.mainInfo.inputs.title.errors.${errors.title}`))}
                                    inputClassName="mb-1.5 bg-[rgb(var(--color-bg-secondary))] border-none focus:bg-[rgb(var(--color-bg))] rounded-md text-sm py-2.5 px-4 transition-colors"
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Input
                                        name="author"
                                        placeholder={firstCap(t('books.manage.edit.mainInfo.inputs.author.placeholder'))}
                                        label={<span>{firstCap(t('books.manage.edit.mainInfo.inputs.author.label'))}</span>}
                                        value={form?.author}
                                        onChange={handleFormChange}
                                        onClearError={clearFieldError('author')}
                                        error={errors.author && firstCap(t(`books.manage.edit.mainInfo.inputs.author.errors.${errors.author}`))}
                                        inputClassName="mb-1.5 bg-[rgb(var(--color-bg-secondary))] border-none focus:bg-[rgb(var(--color-bg))] rounded-md text-sm py-2.5 px-4 transition-colors"
                                    />
                                    <Input
                                        name="isbn"
                                        placeholder={firstCap(t('books.manage.edit.mainInfo.inputs.isbn.placeholder'))}
                                        label={<span>{firstCap(t('books.manage.edit.mainInfo.inputs.isbn.label'))}</span>}
                                        value={form?.isbn}
                                        onChange={handleFormChange}
                                        onClearError={clearFieldError('isbn')}
                                        error={errors.isbn && firstCap(t(`books.manage.edit.mainInfo.inputs.isbn.errors.${errors.isbn}`))}
                                        inputClassName="mb-1.5 bg-[rgb(var(--color-bg-secondary))] border-none focus:bg-[rgb(var(--color-bg))] rounded-md text-sm py-2.5 px-4 transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Input
                                        name="publisher"
                                        placeholder={firstCap(t('books.manage.edit.mainInfo.inputs.publisher.placeholder'))}
                                        label={<span>{firstCap(t('books.manage.edit.mainInfo.inputs.publisher.label'))}</span>}
                                        value={form?.publisher || ''}
                                        onChange={handleFormChange}
                                        onClearError={clearFieldError('publisher')}
                                        error={errors.publisher && firstCap(t(`books.manage.edit.mainInfo.inputs.publisher.errors.${errors.publisher}`))}
                                        inputClassName="mb-1.5 bg-[rgb(var(--color-bg-secondary))] border-none focus:bg-[rgb(var(--color-bg))] rounded-md text-sm py-2.5 px-4 transition-colors"
                                    />
                                    <Input
                                        name="topographicSubject"
                                        placeholder={firstCap(t('books.manage.edit.mainInfo.inputs.topographicSubject.placeholder'))}
                                        label={<span>{firstCap(t('books.manage.edit.mainInfo.inputs.topographicSubject.label'))}</span>}
                                        value={form?.topographicSubject || ''}
                                        onChange={handleFormChange}
                                        onClearError={clearFieldError('topographicSubject')}
                                        error={errors.topographicSubject && firstCap(t(`books.manage.edit.mainInfo.inputs.topographicSubject.errors.${errors.topographicSubject}`))}
                                        inputClassName="mb-1.5 bg-[rgb(var(--color-bg-secondary))] border-none focus:bg-[rgb(var(--color-bg))] rounded-md text-sm py-2.5 px-4 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-[rgb(var(--color-bg))] rounded-lg p-6 border border-[rgb(var(--color-border))] flex flex-col">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] select-none">
                                    category
                                </span>
                                <h2 className="text-base font-bold text-[rgb(var(--color-text))]">
                                    {firstCap(t('books.manage.edit.additionalDetails.title'))}
                                </h2>
                            </div>
                            <div className="flex flex-col gap-5">
                                <div className="w-full">
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
                                                {categoryDisplayValue}
                                            </span>
                                        </Button>
                                        {errors.udcId && <p className="text-red-500 text-xs mt-1">{firstCap(t(`books.manage.edit.additionalDetails.inputs.category.errors.${errors.udcId}`))}</p>}
                                    </div>
                                </div>
                                <Input
                                    name="editionDate"
                                    label={<span>{firstCap(t('books.manage.edit.additionalDetails.inputs.editionDate.label'))}</span>}
                                    type="date"
                                    value={form?.editionDate ? new Date(form.editionDate).toLocaleDateString('en-CA', { timeZone: localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone }) : ''}
                                    onChange={handleFormChange}
                                    onClearError={clearFieldError('editionDate')}
                                    error={errors.editionDate && firstCap(t(`books.manage.edit.additionalDetails.inputs.editionDate.errors.${errors.editionDate}`))}
                                    inputClassName="mb-1.5 bg-[rgb(var(--color-bg-secondary))] border-none focus:bg-[rgb(var(--color-bg))] rounded-md text-sm py-2.5 px-4 transition-colors"
                                />
                                <TagInput
                                    id="edit-book-tags"
                                    label={firstCap(t('books.manage.edit.additionalDetails.inputs.tags.label'))}
                                    tags={form?.tags || []}
                                    inputClassName="mb-1.5 flex-1 bg-[rgb(var(--color-bg-secondary))] border-none"
                                    onChange={(newTags) => setForm((prev) => (prev ? { ...prev, tags: newTags || [] } : { title: '', author: '', isbn: '', udcId: '', publisher: '', editionDate: '', description: '', tags: newTags || [], topographicSubject: '' }))}
                                    placeholder={firstCap(t('books.manage.edit.additionalDetails.inputs.tags.placeholder'))}
                                    error={errors.tags && firstCap(t(`books.manage.edit.additionalDetails.inputs.tags.errors.${errors.tags}`))}
                                />
                                <Input
                                    inputType="textarea"
                                    id="edit-book-description"
                                    name="description"
                                    label={<span>{firstCap(t('books.manage.edit.additionalDetails.inputs.description.label'))}</span>}
                                    value={form?.description ?? ''}
                                    onChange={handleFormChange}
                                    placeholder={firstCap(t('books.manage.edit.additionalDetails.inputs.description.placeholder'))}
                                    rows={3}
                                    inputClassName="bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text))] text-sm rounded-md border-none focus:bg-[rgb(var(--color-bg))] py-2.5 px-4 transition-colors resize-none"
                                    error={errors.description && firstCap(t(`books.manage.edit.additionalDetails.inputs.description.errors.${errors.description}`))}
                                />
                            </div>
                        </div>
                    </div>

                    <DeweyClassificationModal
                        isOpen={showDeweyModal}
                        onSelectCategory={(udcId, label) => {
                            setForm((prev) => (prev ? { ...prev, udcId } : { title: '', author: '', isbn: '', udcId, publisher: '', editionDate: '', description: '', tags: [], topographicSubject: '' }));
                            setShowDeweyModal(false);
                            setCategoryLabel(label);
                        }}
                        onClose={() => setShowDeweyModal(false)}
                    />
                </div>
            ) : (
                <span></span>
            )}
        </>
    );
}
