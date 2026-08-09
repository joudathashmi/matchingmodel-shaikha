import { Router } from "express";
import * as activeMatchesServiceControl from "./active-matches.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/companies", requireAuth, activeMatchesServiceControl.getCompanyList);
router.get("/sector-counts", requireAuth, activeMatchesServiceControl.getSectorsWithCount);
router.get("/match/:id", requireAuth, activeMatchesServiceControl.getMatchById);
router.post("/active-opportunity-matches", requireAuth, activeMatchesServiceControl.getActiveMatches);

// router.get("/companies", activeMatchesServiceControl.getCompanyList);
// router.get("/sector-counts", activeMatchesServiceControl.getSectorsWithCount);
// router.post("/active-opportunity-matches", activeMatchesServiceControl.getActiveMatches);

export default router;