import type { Request, Response, NextFunction } from 'express';
import { auditStorage } from './audit.context';

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'UNKNOWN';
    const userAgent = req.headers['user-agent'] || 'UNKNOWN';

    auditStorage.run({ ipAddress, userAgent }, next);
};
