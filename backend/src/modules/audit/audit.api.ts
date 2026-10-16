import { AuditService } from './audit.service';
import { auditStorage } from './audit.context';
import type {
    GetAuditLogsParams,
    AuditLogOptions,
} from '@LibSoft/shared-types';

export const auditApi = {
    log: (options: AuditLogOptions) => {
        const httpContext = auditStorage.getStore();

        const enrichedOptions: AuditLogOptions = {
            ...options,
            userId: options.userId || httpContext?.userId,
            ipAddress: options.ipAddress || httpContext?.ipAddress || null,
            userAgent: options.userAgent || httpContext?.userAgent || null,
        };

        return AuditService.log(enrichedOptions);
    },
    getLogs: (params?: GetAuditLogsParams) => AuditService.getAuditLogs(params),
    getById: (id: string) => AuditService.getAuditLogById(id),
};
