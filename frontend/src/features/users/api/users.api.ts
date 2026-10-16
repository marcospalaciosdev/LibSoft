import { httpClient } from '@/shared/services/http';

import type {
  User,
  CreateUserDto,
  GetUsersParams,
} from '@LibSoft/shared-types';

const serializeParams = (params: Record<string, any>): Record<string, string> => {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = String(value);
    }
    return acc;
  }, {} as Record<string, string>);
};

export const usersApi = {
  getAll: (params?: GetUsersParams) => httpClient.get<User[]>('/users',
    params ? { params: serializeParams(params) } : undefined
  ),

  getCount: (params?: Pick<GetUsersParams, 'search' | 'role' | 'status'>) =>
    httpClient.get<number>('/users/count', params ? { params: serializeParams(params) } : undefined),

  getById: (id: string) => httpClient.get<User>(`/users/${id}`),

  create: (data: CreateUserDto) => httpClient.post<User>('/users', data),

  update: (id: string, data: User) => httpClient.put<User>(`/users/${id}`, data),

  delete: (id: string) => httpClient.delete(`/users/${id}`),
};
