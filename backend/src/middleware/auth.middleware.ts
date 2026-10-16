import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { setAuditUser } from '../modules/audit/audit.context';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        username: string;
        email: string;
        roleId: string;
    };
}

export async function authenticateSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void | Response> {
    const userId = (req.session as typeof req.session & { userId?: string }).userId;

    if (!userId) {
        return res.status(401).json({ message: 'Sesión requerida' });
    }

    const userResult = await pool.query(
        'SELECT id, username, email, role_id FROM public.users WHERE id = $1 AND is_active = true',
        [userId]
    );

    if (userResult.rowCount === 0) {
        return res.status(401).json({ message: 'Usuario no encontrado o inactivo' });
    }

    const user = userResult.rows[0];
    req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        roleId: String(user.role_id),
    };
    setAuditUser(user.id);
    next();
}
