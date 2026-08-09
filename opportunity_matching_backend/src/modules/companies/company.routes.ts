// src\modules\companies\company.routes.ts
import { Router } from "express";
import * as companyControl from "./company.controller";
import { validate } from "../../middlewares/validate.middleware";
import { listCompaniesSchema, getCompanyDetailsSchema } from "../../validations/company.schema";
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.get("/stats", requireAuth, companyControl.getCompanyStats);
router.get("/sector-counts", requireAuth, companyControl.getSectorsWithCount);
router.post("/", requireAuth, validate(listCompaniesSchema), companyControl.listCompanies);
/** On-demand single-company rematch (must stay before /:id) */
router.post("/rematch", requireAuth, companyControl.rematchCompanyHandler);
router.get("/rematch/:jobId", requireAuth, companyControl.rematchJobStatusHandler);
router.get("/:id", requireAuth, validate(getCompanyDetailsSchema), companyControl.getCompanyDetails);

export default router;
