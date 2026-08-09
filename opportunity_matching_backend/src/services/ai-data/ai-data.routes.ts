// src\services\ai-data\ai-data.routes.ts
import { Router } from "express";
import * as aiDataServiceControl from "./ai-data.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/services/:page", requireAuth, aiDataServiceControl.getPageAIData);
router.post("/chat", requireAuth, aiDataServiceControl.postChat);

export default router;