// src/services/match-agreement/match-agreement.routes.ts
import { Router } from "express";
import { MatchAgreementController } from "./match-agreement.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();
const controller = new MatchAgreementController();

router.post("/", requireAuth, controller.setAgreement.bind(controller));
router.delete("/", requireAuth, controller.deleteAgreement.bind(controller));
// Officers list their own pursuits; admin-only listing removed for IPA workbench
router.get("/", requireAuth, controller.listAgreements.bind(controller));

export default router;
