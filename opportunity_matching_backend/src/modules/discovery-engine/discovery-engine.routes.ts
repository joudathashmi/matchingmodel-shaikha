import { Router } from "express";
import * as activeMatchesServiceControl from "./discovery-engine.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/sector-counts", requireAuth, activeMatchesServiceControl.getSectorsWithCount);
router.post("/discovery-engine", requireAuth, activeMatchesServiceControl.getDiscoveryEngine);

export default router;