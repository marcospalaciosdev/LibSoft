import { PrismaClient } from '@prisma/client';
import camelcaseKeys from 'camelcase-keys';

import type { AuditLogOptions, GetAuditLogsParams } from '@LibSoft/shared-types';

const prisma = new PrismaClient();

export class AuditService {
    private static sanitize(data: any): any {
        if (!data) return data ?? null;
        const toISOString = (val: any): string | null => {
            if (val instanceof Date) return isNaN(val.getTime()) ? null : val.toISOString();
            if (typeof val === 'string') {
                const trimmed = val.trim();
                const latamDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/;
                const match = trimmed.match(latamDateRegex);

                if (match) {
                    const [, day, month, year, hours = '00', minutes = '00', seconds = '00'] = match;
                    const parsedDate = new Date(Date.UTC(
                        parseInt(year, 10),
                        parseInt(month, 10) - 1,
                        parseInt(day, 10),
                        parseInt(hours, 10),
                        parseInt(minutes, 10),
                        parseInt(seconds, 10)
                    ));
                    return isNaN(parsedDate.getTime()) ? val : parsedDate.toISOString();
                }

                if (trimmed.length >= 10 && (trimmed.includes('-') || trimmed.includes('T'))) {
                    const parsed = new Date(trimmed);
                    if (!isNaN(parsed.getTime())) return parsed.toISOString();
                }
            }
            return null;
        };

        const isoResult = toISOString(data);
        if (isoResult) return isoResult;
        if (typeof data !== 'object') return data;
        if (Array.isArray(data)) return data.map(item => this.sanitize(item));

        const sensitiveFields = ['password', 'token', 'secret', 'hash', 'password_hash', 'currentPassword', 'newPassword'];
        const sanitized: Record<string, any> = {};

        for (const [key, value] of Object.entries(data)) {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                sanitized[key] = '[REDACTED]';
                continue;
            }
            const parsedIso = toISOString(value);
            if (parsedIso) sanitized[key] = parsedIso;
            else if (typeof value === 'object' && value !== null) sanitized[key] = this.sanitize(value);
            else sanitized[key] = value;
        }

        return sanitized;
    };

    static async log(options: AuditLogOptions): Promise<void> {
        try {
            const { req, module, action, entityId, oldValues, newValues, metadata } = options;

            const userId = options.userId || (req as any)?.user?.id || null;

            const ipAddress = options.ipAddress ||
                (req ? (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || null) : null);

            const userAgent = options.userAgent ||
                (req ? (req.headers['user-agent'] as string || null) : null);

            await prisma.audit_logs.create({
                data: {
                    user_id: userId,
                    module,
                    action,
                    entity_id: entityId ? String(entityId) : null,
                    old_values: this.sanitize(oldValues),
                    new_values: this.sanitize(newValues),
                    metadata: this.sanitize(metadata),
                    ip_address: ipAddress,
                    user_agent: userAgent,
                },
            });
        } catch (error) {
            console.error('[AuditService] Error al guardar log de auditoría:', error);
        }
    }

    static async getAuditLogs(params: GetAuditLogsParams = {}) {

        const offset = Math.max(0, Number(params.offset) || 0);
        const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));

        const skip = (offset * limit);
        const take = limit;

        const where: any = {
            module: {
                contains: params.module || '',
                mode: 'insensitive',
            },
            action: {
                contains: params.action || '',
                mode: 'insensitive',
            },
            created_at: {
                gte: params.startDate ? new Date(params.startDate) : undefined,
                lte: params.endDate ? new Date(params.endDate) : undefined,
            },
        };

        const langCode = 'es';
        const [total, logs] = await Promise.all([
            prisma.audit_logs.count({
                where: where,
            }),
            prisma.audit_logs.findMany({
                orderBy: {
                    created_at: 'desc',
                },
                where: where,
                skip: skip,
                take: take,
                select: {
                    id: true,
                    module: true,
                    action: true,
                    created_at: true,
                    ip_address: true,
                    user: {
                        select: {
                            id: true,
                            username: true,
                            first_name: true,
                            last_name: true,
                            role: {
                                select: {
                                    id: true,
                                    roles_names: {
                                        where: {
                                            lng_id: langCode,
                                        },
                                        select: {
                                            name: true,
                                        },
                                        take: 1,
                                    },
                                },
                            },
                        },
                    },
                },
            })
        ]);

        return {
            data: formatAuditLogsUserRole(logs),
            pagination: {
                total,
                offset,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    static async getAuditLogById(id: string) {
        const langCode = 'es';
        const log = await prisma.audit_logs.findUnique({
            where: { id },
            select: {
                id: true,
                module: true,
                action: true,
                entity_id: true,
                ip_address: true,
                created_at: true,
                user_agent: true,
                old_values: true,
                new_values: true,
                metadata: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        first_name: true,
                        last_name: true,
                        role: {
                            select: {
                                id: true,
                                roles_names: {
                                    where: {
                                        lng_id: langCode,
                                    },
                                    select: {
                                        name: true,
                                    },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!log) return null;
        return formatAuditLogsUserRole(log);
    }
}

function formatAuditLogsUserRole(data: any) {
    if (!data) return null;
    const processSingleLog = (log: any) => {
        if (!log) return null;
        const { old_values, new_values, metadata, ...rest } = log;
        const role = rest.user?.role;
        const roleName = role?.roles_names?.[0]?.name ?? null;
        const transformed = {
            ...rest,
            user: rest.user
                ? {
                    ...rest.user,
                    role: role
                        ? {
                            id: role.id,
                            name: roleName,
                        }
                        : null,
                }
                : null,
        };
        const camelCased = camelcaseKeys(transformed, { deep: true });
        return {
            ...camelCased,
            oldValues: old_values ?? null,
            newValues: new_values ?? null,
            metadata: metadata ?? null,
        };
    };
    return Array.isArray(data) ? data.map(processSingleLog) : processSingleLog(data);
}