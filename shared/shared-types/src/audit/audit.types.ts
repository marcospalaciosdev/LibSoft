import { RoleResponseDto } from "../roles/roles.types";

export interface AuditLogOptions {
    req?: any;
    userId?: string;
    module: string;
    action: string;
    entityId?: string | number;
    oldValues?: Record<string, any> | null;
    newValues?: Record<string, any> | null;
    metadata?: Record<string, any> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}

export interface GetAuditLogsParams {
    offset?: number;
    limit?: number;
    module?: string;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}

export interface AuditUser {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: RoleResponseDto | null;
}

export interface AuditLogItem {
    id: string;
    userId?: string | null;
    module: string;
    action: string;
    entityId?: string | null;
    oldValues?: Record<string, any> | null;
    newValues?: Record<string, any> | null;
    metadata?: Record<string, any> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: string;
    user?: AuditUser | null;
}

export interface AuditPagination {
    total: number;
    offset: number;
    limit: number;
    totalPages: number;
}

export interface AuditLogsResponse {
    data: AuditLogItem[];
    pagination: AuditPagination;
}