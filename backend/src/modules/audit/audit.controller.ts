import { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { GetAuditLogsParams } from '@LibSoft/shared-types';

export async function getAuditLogs(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const result = await AuditService.getAuditLogs(req.query as GetAuditLogsParams | {});
        res.json(result);
    } catch (error) {
        console.error('Error al obtener logs de auditoría:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener logs de auditoría' });
    }
}

export async function getAuditLogById(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const log = await AuditService.getAuditLogById(Array.isArray(id) ? id[0] : id);

        if (!log) {
            res.status(404).json({ message: 'Log de auditoría no encontrado' });
            return;
        }

        res.json(log);
    } catch (error) {
        console.error('Error al obtener detalle de log de auditoría:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el detalle del log' });
    }
}
