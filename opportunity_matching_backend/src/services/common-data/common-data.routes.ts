// src/routes/common-data.routes.ts
import { Router } from 'express';
import { CommonDataController } from '../common-data/common-data.controller';

const router = Router();

router.post('/clamp', CommonDataController.getClamp);

export default router;
