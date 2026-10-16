export * from './udc.types';
import type { DeweyClassificationDto } from './udc.types';

export interface Book {
    id: string;
    title: string;
    author: string;
    isbn: string;
    category?: string;
    publisher?: string;
    editionDate?: Date | string;
    description?: string;
    totalCopies: number;
    copiesAvailable: number;
    borrowedCopies: number;
    createdAt?: string;
    updatedAt?: string;
    tags?: string[];
    topographicSubject?: string;
}

export interface BookDetail {
    id: string | number;
    title: string;
    author: string;
    isbn: string;
    category?: string | null;
    publisher?: string | null;
    editionDate?: Date | string | null;
    description?: string | null;
    topographicSubject?: string | null;
    createdAt?: string | Date;
    deweyCategory?: string | null;
    deweyClassification?: {
        code: string;
        label?: string;
        name?: string;
    } | null;
    tags?: string[];
}

export interface BookCategory {
    id: string | number;
    name: string;
}

export interface BookDTO {
    title: string;
    author: string;
    isbn: string;
    udcId?: string;
    publisher?: string | null;
    editionDate?: string | Date | null;
    description?: string | null;
    tags?: string[];
    topographicSubject?: string | null;
    deweyClassification?: DeweyClassificationDto;
}

export interface EditBookDTO {
    title: string;
    author: string;
    isbn: string;
    udcId?: string;
    categoryId?: string;
    publisher?: string | null;
    editionDate?: string | Date | null;
    description?: string | null;
    tags?: string[];
    topographicSubject?: string | null;
}

export interface BookRawState {
    id: string | number;
    title: string;
    author: string;
    isbn: string;
    publisher?: string | null;
    description?: string | null;
    topographic_subject?: string | null;
    edition_date?: Date | string | null;
    created_at?: Date | string;
    dewey_category_id?: string | null;
}

export interface BookCopy {
    id: string;
    bookId?: string | number | bigint;
    book?: string;
    inventoryNumber: string;
    isAvailable: boolean;
    timesLoaned: number;
}

export interface CreateBookCopyDTO {
    book_id?: string | number | bigint;
    bookId?: string | number | bigint;
    inventoryNumber: string;
}

export interface DetailedBookCopyResponse {
    copyData: {
        copy_id?: number | string;
        copyId?: number | string;
        book_id?: number | string | bigint;
        bookId?: number | string | bigint;
        inventory_number?: string;
        inventoryNumber?: string;
    };
    bookData: {
        title: string;
        author: string;
        isbn: string;
        description: string | null;
        publisher: string | null;
        topographic_subject?: string | null;
        topographicSubject?: string | null;
        created_at?: Date | string | null;
        createdAt?: Date | string | null;
        edition_date?: Date | string | null;
        editionDate?: Date | string | null;
        dewey_classification?: {
            code: string;
            name: string | null;
        } | null;
        deweyClassification?: {
            code: string;
            name: string | null;
        } | null;
    };
    times_loaned?: number;
    timesLoaned?: number;
}

export interface GetBooksParams {
    title?: string;
    isbn?: string;
    categoryId?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC' | 'asc' | 'desc' | string;
    lang?: string | null;
}

export interface GetCopiesParams {
    onlyAvailable?: boolean | string;
    searchTerm?: string;
    limit?: number | string;
    page?: number | string;
}

export interface GetCategoriesFrequencyParams {
    limit?: number;
    lang?: string;
}

export interface UnitsAmountByBookResponse {
    total: number;
    availableCopies: number;
    borrowedCopies: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}
