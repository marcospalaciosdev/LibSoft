import { Router } from 'express';
import * as MaintenanceController from './maintenanceController';

const router = Router();

router.get('/backups', MaintenanceController.getBackupsHistory);
router.post('/backups', MaintenanceController.createBackup);
router.post('/backups/restore', MaintenanceController.restoreBackup);

export default router;
