import { Router } from 'express';
import * as loanController from './loanController';
import { authenticateSession } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticateSession);

router.get('/', loanController.getLoans);
router.get('/count', loanController.getLoansCount);

router.post('/', loanController.createLoan);
router.get('/metrics/returns-by-month', loanController.getReturnMetricsByMonth);
router.get('/metrics/summary', loanController.getLoanSummaryMetrics);
router.get('/:id', loanController.getLoanById);
router.patch('/:id/return', loanController.returnLoan);
router.delete('/:id', loanController.deleteLoan);

export default router;
