import { Router } from "express";
import * as executiveOverviewServiceControl from "./executive-overview.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/sector-counts", requireAuth, executiveOverviewServiceControl.getSectorsWithCount);
router.post("/top-opportunities", requireAuth, executiveOverviewServiceControl.getTopOpportunities);

export default router;