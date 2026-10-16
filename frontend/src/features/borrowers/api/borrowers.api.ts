import { httpClient } from '@/shared/services/http';

import type {
  BorrowerGetAllParams,
  BorrowerDTO,
  CreateBorrowerDTO,
  CreateBorrowerErrors,
  UpdateBorrowerDTO
} from '@Libsoft/shared-types';

export const borrowersApi = {
  getAll: (params?: BorrowerGetAllParams) =>
    httpClient.get<{ data: BorrowerDTO[]; total: number }>('/borrowers', {
      params: params ? Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])) : undefined,
    }),

  getAmount: () => httpClient.get<number>('/borrowers/amount'),

  getById: (id: string) => httpClient.get<BorrowerDTO>(`/borrowers/${id}`),

  create: (data: CreateBorrowerDTO) => httpClient.post<CreateBorrowerErrors>('/borrowers', data),

  update: (id: string, data: Partial<UpdateBorrowerDTO>) =>
    httpClient.put<UpdateBorrowerDTO>(`/borrowers/${id}`, data),

  delete: (id: string) => httpClient.delete(`/borrowers/${id}`),
};
