import { Request, Response, NextFunction } from "express";
import * as discoveryEngineService from "./discovery-engine.service";
import { discoveryEngineSchema } from "../../validations/discovery-engine.schema";
import { AuthRequest } from "../../types/auth-request";

export const getSectorsWithCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ai_decision, topRank } = req.query;

    const result = await discoveryEngineService.getMappedSectorsWithCount(
      ai_decision as string | undefined,
      topRank ? Number(topRank) : undefined
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getDiscoveryEngine = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = discoveryEngineSchema.parse(req.body);
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User ID is required");
    }
    const result = await discoveryEngineService.getDiscoveryEngine(body, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
