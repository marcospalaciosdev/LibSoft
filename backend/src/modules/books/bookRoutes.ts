import { Router } from 'express';
import * as BookController from './bookController';
import { validateBody } from '../../utils/validateReqBody';
import { createBookSchema, createBookCopySchema } from './schemas/bookSchemas';
import { authenticateSession } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticateSession);

router.get('/categories', BookController.getCategories);
router.get('/categories/frecuency', BookController.getCategoriesFrecuency);
router.get('/metrics/borrowed-percentage', BookController.getBorrowedPercentage);

router.get('/amount', BookController.getAmount);
router.get('/', BookController.getAllBooks);

router.get('/deweyClassifications', BookController.getDeweyClassifications);
router.get('/deweyClassifications/amount', BookController.getDeweyClassificationsAmount);

router.get('/copies/availability', BookController.checkCopyAvailability);
router.get('/copies/:id/details', BookController.getCopyDetails);
router.put('/copies/:id', BookController.updateCopy);
router.delete('/copies/bulk-delete', BookController.deleteCopiesBulk);
router.delete('/copies/:id', BookController.deleteCopy);

router.get('/:id/copies/amount', BookController.getBookUnitsAmount);
router.get('/:id/copies', BookController.getBookCopies);
router.post('/:id/copies', validateBody(createBookCopySchema), BookController.createCopy);

router.post('/', validateBody(createBookSchema), BookController.createBook);
router.put('/:id', validateBody(createBookSchema), BookController.updateBook);
router.delete('/:id', BookController.deleteBook);


router.get('/:id', BookController.getBookById);

export default router;