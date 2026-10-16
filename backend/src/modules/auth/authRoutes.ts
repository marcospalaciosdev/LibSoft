import { Router } from 'express';
import * as authController from './authController';

import { RegisterSchema } from './schemas/register.schemas';
import { SetupAdminSchema } from './schemas/setup-admin.schemas';
import { validateBody } from '../../utils/validateReqBody';
import { LoginSchema } from './schemas/login.schemas';
import { authenticateSession } from '../../middleware/auth.middleware';

const router = Router();

router.get('/setup-status', authController.getSetupStatus);
router.post('/setup-admin', validateBody(SetupAdminSchema), authController.setupInitialAdmin);
router.post('/register', authenticateSession, validateBody(RegisterSchema), authController.regiterUser);
router.post('/login', validateBody(LoginSchema), authController.loginUser);
router.post('/checkEmailAvailability', authController.checkEmailAvailability);
router.get('/me', authenticateSession, authController.getMe);
router.post('/logout', authenticateSession, authController.logoutUser);

export default router;