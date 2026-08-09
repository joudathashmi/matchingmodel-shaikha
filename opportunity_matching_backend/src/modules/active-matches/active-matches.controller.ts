import { Request, Response, NextFunction } from "express";
import * as activeMatchesService from "./active-matches.service";
import { activeMatchesSchema } from "../../validations/active-matches.schema";
import { AuthRequest } from "../../types/auth-request";

export const getCompanyList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companies = await activeMatchesService.getCompanyList();
    res.json(companies);
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
    const { ai_decision, topRank } = req.query;

    const result = await activeMatchesService.getMappedSectorsWithCount(
      ai_decision as string | undefined,
      topRank ? Number(topRank) : undefined
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getActiveMatches = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = activeMatchesSchema.parse(req.body);
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User ID is required");
    }
    const result = await activeMatchesService.getActiveMatches(body, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getMatchById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User ID is required");
    const matchId = Number(req.params.id);
    if (!Number.isFinite(matchId)) {
      return res.status(400).json({ error: "Invalid match id" });
    }
    const match = await activeMatchesService.getMatchById(matchId, userId);
    if (!match) return res.status(404).json({ error: "Match not found" });
    res.json({ data: match });
  } catch (err) {
    next(err);
  }
};
