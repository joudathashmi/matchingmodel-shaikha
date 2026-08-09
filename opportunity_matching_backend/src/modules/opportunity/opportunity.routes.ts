// src\modules\opportunity\opportunity.routes.ts
import { Router } from "express";
import * as opportunityControl from "./opportunity.controller";
import { validate } from "../../middlewares/validate.middleware";
import { opportunitySchema, getOpportunityDetailsSchema } from "../../validations/opportunity.schema";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/sector-counts", requireAuth, opportunityControl.getSectorsWithCount);
router.post("/", requireAuth, validate(opportunitySchema), opportunityControl.listOpportunities);
router.get("/:id", requireAuth, validate(getOpportunityDetailsSchema), opportunityControl.getOpportunityDetails);

// router.get("/sector-counts", opportunityControl.getSectorsWithCount);
// router.post("/", validate(opportunitySchema), opportunityControl.listOpportunities);
// router.get("/:id", validate(getOpportunityDetailsSchema), opportunityControl.getOpportunityDetails);

export default router;