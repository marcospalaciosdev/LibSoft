import type { RoleResponseDto } from '../roles/roles.types';

export interface User {
    id: string;
    username: string;
    dni: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    address?: string;
    role: RoleResponseDto;
    avatarUrl?: string;
    isActive: boolean;
    createdAt: string;
}

export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'librarian' | 'user';
}

export interface GetUsersParams {
    search?: string;
    role?: string;
    status?: string;
    limit?: number;
    offset?: number;
}

export interface UserPreview {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string | null;
}
