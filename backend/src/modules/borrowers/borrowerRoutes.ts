import { Router } from 'express';
import * as BorrowerController from './borrowerController';
import { validateBody } from '../../utils/validateReqBody';
import { CreateBorrowerSchema, UpdateBorrowerSchema } from './schemas/borrowerSchemas';

const router = Router();

router.post('/', validateBody(CreateBorrowerSchema), BorrowerController.createBorrower);

router.get('/', BorrowerController.getAllBorrowers);
router.get('/amount', BorrowerController.getBorrowersAmount);

router.get('/:id', BorrowerController.getBorrowerById);
router.put('/:id', validateBody(UpdateBorrowerSchema), BorrowerController.updateBorrower);


export default router;
