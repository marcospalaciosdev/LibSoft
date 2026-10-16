import { Router } from 'express';
import * as HelpController from './helpController';

const router = Router();

router.get('/:lang', HelpController.getFaqsByLanguage);
router.get('/ids/:lang', HelpController.getFaqsByIds);
router.get('/codes/:lang', HelpController.getFaqsByCodes);

export default router;