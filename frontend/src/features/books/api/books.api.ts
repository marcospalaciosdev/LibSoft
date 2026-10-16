import { httpClient } from '@/shared/services/http';

import type {
  PaginatedResponse,
  Book,
  BookDTO,
  EditBookDTO,
  DeweyClassificationDto,
  BorrowedMetrics,
  CategoryFrequencyResponse,
  GetUDCListParams,
  GetUDCAmountParams,
  UnitsAmountByBookResponse,
  BookCopy
} from '@Libsoft/shared-types';

export const booksApi = {
  getAll: (params?: Record<string, any>) =>
    httpClient.get<PaginatedResponse<Book>>('/books', { params }),

  getUnits: (params: {
    bookId: string,
    onlyAvailable?: boolean,
    searchTerm?: string,
    limit?: number,
    page?: number
  }) =>
    httpClient.get<BookCopy[]>(`/books/${params.bookId}/copies`, {
      params: {
        onlyAvailable: String(params.onlyAvailable),
        searchTerm: String(params.searchTerm ?? ''),
        limit: String(params.limit),
        page: String(params.page)
      }
    }),

  getUnitsAmountByBook: (book_id: string) => httpClient.get<UnitsAmountByBookResponse>(`/books/${book_id}/copies/amount`),

  getById: (id: string, lang: string) => httpClient.get<Book>(`/books/${id}`, { params: { lang } }),

  create: (data: BookDTO) => httpClient.post<Book>('/books', data),
  delete: (id: string) => httpClient.delete(`/books/${id}`),

  createCopy: (book_id: string, inventoryNumber: string) => httpClient.post<any>(`/books/${book_id}/copies`, { inventoryNumber }),
  updateCopy: (copy_id: string, inventoryNumber: string) => httpClient.put<any>(`/books/copies/${copy_id}`, { inventoryNumber }),
  deleteCopy: (copy_id: string) => httpClient.delete(`/books/copies/${copy_id}`),

  deleteCopiesBulk: (copyIds: string[]) =>
    httpClient.delete<any>('/books/copies/bulk-delete', {
      params: { ids: copyIds.join(',') }
    }),

  checkCopyAvailability: (inventoryNumber: string) => httpClient.get<boolean>(`/books/copies/availability`, { params: { inventoryNumber } }),

  update: (id: string, data: Partial<EditBookDTO>) => httpClient.put<Book>(`/books/${id}`, data),

  getAmount: () => httpClient.get(`/books/amount`),

  getCategories: () => httpClient.get<[]>(`/books/categories`),

  getCategoriesFrecuency: (params: { lang: string, limit: string }) => httpClient.get<CategoryFrequencyResponse[]>(`/books/categories/frecuency`, { params }),

  getDeweyClassifications: (params: GetUDCListParams) =>
    httpClient.get<DeweyClassificationDto[]>('/books/deweyClassifications', {
      params: {
        lang: String(params.lang),
        searchTerm: String(params.searchTerm ?? ''),
        min: String(params.min ?? ''),
        max: String(params.max ?? ''),
        includeUnassigned: String(params.includeUnassigned),
        includeDiscontinued: String(params.includeDiscontinued),
        page: String(params.page),
        limit: String(params.limit),
      },
    }),

  getDeweyClassificationsAmount: (params: GetUDCAmountParams) =>
    httpClient.get<number>(`/books/deweyClassifications/amount`, {
      params: {
        lang: String(params.lang ?? ''),
        searchTerm: String(params.searchTerm ?? ''),
        min: String(params.min ?? ''),
        max: String(params.max ?? ''),
        includeUnassigned: String(params.includeUnassigned),
        includeDiscontinued: String(params.includeDiscontinued)
      }
    }),

  getBorrowedMetrics: () => httpClient.get<BorrowedMetrics>('/books/metrics/borrowed-percentage'),

  getDetailedCopy: (copy_id: string) => httpClient.get<any>(`/books/copies/${copy_id}/details`),
};
