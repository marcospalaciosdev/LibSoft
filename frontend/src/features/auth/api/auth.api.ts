import { httpClient } from '@/shared/services/http';
import type { User } from '@LibSoft/shared-types';

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  roleId: string;
  phoneNumber: string;
  password: string;
}

export interface SetupAdminRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface SetupStatusResponse {
  requiresSetup: boolean;
}

interface LoginResponse {
  user: User;
}

export const authApi = {
  login: (credentials: LoginRequest) => httpClient.post<LoginResponse>('/auth/login', credentials),

  checkEmailAvailability: (email: { email: string }) => httpClient.post<boolean>('/auth/checkEmailAvailability', email),

  register: (data: RegisterRequest) =>
    httpClient.post<RegisterRequest>('/auth/register', data),

  getSetupStatus: () => httpClient.get<SetupStatusResponse>('/auth/setup-status'),

  setupAdmin: (data: SetupAdminRequest) =>
    httpClient.post<{ message: string }>('/auth/setup-admin', data),

  me: () => httpClient.get<User>('/auth/me'),

  logout: () => httpClient.post('/auth/logout'),
};
