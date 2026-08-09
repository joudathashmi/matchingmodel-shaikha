// src\modules\companies\company.controller.ts 
import { Request, Response, NextFunction } from "express";
import * as companyService from "./company.service";
import { listCompaniesSchema, rematchCompanySchema } from "../../validations/company.schema";
import {
  getRematchJob,
  startRematchJob,
} from "../../services/on-demand-match/on-demand-match.service";

export const getCompanyStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await companyService.getCompanyStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

export const getSectorsWithCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.query;

    const result = await companyService.getMappedSectorsWithCount(
      status as string | undefined,
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const listCompanies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = listCompaniesSchema.parse(req.body);
    const result = await companyService.getCompanies(body);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getCompanyDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid company ID" });
    }

    const { ai_decision } = req.query; 
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User ID is required");
    }
    const company = await companyService.getCompanyById(id, userId, ai_decision as string | undefined);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ company});
  } catch (err) {
    next(err);
  }
};

/**
 * Start on-demand rematch job (returns immediately with jobId for progress polling).
 */
export const rematchCompanyHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = rematchCompanySchema.parse(req.body);
    const job = await startRematchJob(body);
    res.status(202).json(job);
  } catch (err: any) {
    if (err?.status === 404 || err?.status === 400) {
      return res.status(err.status).json({ ok: false, error: err.message });
    }
    next(err);
  }
};

/** Poll rematch job progress / result */
export const rematchJobStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const jobId = String(req.params.jobId || "");
    const job = getRematchJob(jobId);
    if (!job) {
      return res.status(404).json({ ok: false, error: "Rematch job not found" });
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
};

