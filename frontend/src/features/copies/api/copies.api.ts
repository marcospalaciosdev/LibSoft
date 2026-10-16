import { httpClient } from '@/shared/services/http';

export interface Copy {
  id: string;
  bookId: string;
  bookTitle: string;
  code: string;
  condition: 'new' | 'good' | 'fair' | 'poor';
  status: 'available' | 'loaned' | 'lost' | 'damaged';
  location?: string;
  createdAt: string;
}

export interface CreateCopyDto {
  bookId: string;
  code: string;
  condition: Copy['condition'];
  location?: string;
}

export const copiesApi = {
  getAll: (params?: Record<string, string>) =>
    httpClient.get<{ data: Copy[]; total: number }>('/copies', { params }),

  getByBook: (bookId: string) => httpClient.get<Copy[]>(`/books/${bookId}/copies`),

  getById: (id: string) => httpClient.get<Copy>(`/copies/${id}`),

  create: (data: CreateCopyDto) => httpClient.post<Copy>('/copies', data),

  update: (id: string, data: Partial<CreateCopyDto>) => httpClient.put<Copy>(`/copies/${id}`, data),

  delete: (id: string) => httpClient.delete(`/copies/${id}`),
};
