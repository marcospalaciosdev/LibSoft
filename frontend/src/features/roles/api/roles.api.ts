import type {
    RoleResponseDto,
    GetRolesParams,
    PermissionItem,
    AddRoleDto
} from '@LibSoft/shared-types';

import { httpClient } from "@/shared/services/http";

const serializeParams = (params: Record<string, any>): Record<string, string> => {
    return Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
            acc[key] = String(value);
        }
        return acc;
    }, {} as Record<string, string>);
};

export const rolesApi = {
    getRoles: (params?: GetRolesParams) => httpClient.get<RoleResponseDto[]>(`/roles`, params ? { params: serializeParams(params) } : undefined),

    getRolesCount: () => httpClient.get<number>(`/roles/count`),

    addRole: (data: AddRoleDto) => httpClient.post<RoleResponseDto>(`/roles`, data),

    getAllPermissions: () => httpClient.get<PermissionItem[]>('/roles/permissions'),

    updatePermissionsMatrix: (matrix: any) => httpClient.put<any>('/roles/permissions', { matrix })
}
