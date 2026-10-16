import { httpClient } from '@/shared/services/http';
import type {
    GetAuditLogsParams,
    AuditLogsResponse,
    AuditLogItem,
} from '@LibSoft/shared-types';

export const auditApi = {
    getLogs: (params?: GetAuditLogsParams) =>
        httpClient.get<AuditLogsResponse>('/audit', { params }),

    getById: (id: string) =>
        httpClient.get<AuditLogItem>(`/audit/${id}`),
};