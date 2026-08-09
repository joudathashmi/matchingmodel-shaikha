//src\modules\auth\auth.routes.ts
import { Router } from 'express';
import * as authControl from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { validateApiKey } from '../../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../../validations/auth.schema';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/sso/status', authControl.ssoStatus);
router.post('/sso/start', authControl.ssoStart);
router.post('/nafath/callback', validateApiKey, authControl.nafath_callback);
router.post('/register', validate(registerSchema), authControl.register);
router.post('/login', validate(loginSchema), authControl.login);
router.post('/refresh', authControl.refresh);
router.post('/logout', authControl.logout);

router.get('/roles', requireAuth, authControl.getUserRoles);
router.get('/sessions', requireAuth, authControl.getUserSessions);

export default router;
