import { Request, Response } from 'express';
import { BackupService } from './maintenanceService';

export const getBackupsHistory = async (_req: Request, res: Response) => {
    try {
        const backups = await BackupService.getBackupsHistory();
        return res.status(200).json(backups);
    } catch (error) {
        return res.status(500).json({
            error: 'Error interno al consultar el historial de copias de seguridad'
        });
    }
};

export const createBackup = async (_req: Request, res: Response) => {
    try {
        const record = await BackupService.createBackup();
        return res.status(201).json(record);
    } catch (error: any) {
        console.error('[createBackup]', error);
        return res.status(500).json({ error: error.message ?? 'Error al crear la copia de seguridad' });
    }
};

export const restoreBackup = async (req: Request, res: Response) => {
    const { filePath } = req.body as { filePath?: string };

    if (!filePath) {
        return res.status(400).json({ error: 'Se requiere filePath en el cuerpo de la petición.' });
    }

    try {
        const result = await BackupService.restoreBackup(filePath);
        const status = result.success ? 200 : 500;
        return res.status(status).json(result);
    } catch (error: any) {
        console.error('[restoreBackup]', error);
        return res.status(500).json({ error: error.message ?? 'Error al restaurar la copia de seguridad' });
    }
};
