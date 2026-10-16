import { Router } from 'express';
import * as languagesController from './languagesController';

const router = Router();

router.get('/', languagesController.getAvailableLanguages);

export default router;
