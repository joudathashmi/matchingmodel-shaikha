// src\services\smart-search\smart-search.routes.ts
import { Router } from "express";
import * as smartSearchServiceControl from "./smart-search.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/services", requireAuth, smartSearchServiceControl.search);

export default router;