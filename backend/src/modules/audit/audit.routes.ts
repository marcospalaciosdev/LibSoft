import { Router } from 'express';
import * as auditController from './audit.controller';

const router = Router();

router.get('/', auditController.getAuditLogs);
router.get('/:id', auditController.getAuditLogById);

export default router;