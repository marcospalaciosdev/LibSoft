import { AsyncLocalStorage } from 'async_hooks';

export interface AuditHttpContext {
    ipAddress: string;
    userAgent: string;
    userId?: string;
}

export const auditStorage = new AsyncLocalStorage<AuditHttpContext>();

export function setAuditUser(userId: string): void {
    const store = auditStorage.getStore();
    if (store) {
        store.userId = userId;
    }
}