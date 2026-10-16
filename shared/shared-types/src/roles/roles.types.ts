export interface RoleResponseDto {
    id: number;
    name: string;
    type: 'default' | 'custom';
    slug: string;
    usersPreview?: RolesResponseUserPreview[];
    permissions?: Permission[];
    description?: string;
    colorRGB?: string;
}

export interface RolesResponseUserPreview {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string;
}

export interface Permission {
    permissionId: number;
    moduleId: number;
    module: string;
    actionId: number;
    action: string;
}

export interface GetRolesParams {
    lang?: string;
    users?: boolean;
    usersLimit?: number;
    includeAdmin?: boolean;
    includePermissions?: boolean;
}

export interface PermissionItem {
    permissionId: number;
    moduleId: number;
    module: string;
    actionId: number;
    action: string;
}

export interface AddRoleDto {
    slug: string;
    translations: { languageCode: string; name: string; description: string }[];
    colorRGB: string;
}