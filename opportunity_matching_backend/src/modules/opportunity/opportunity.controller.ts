import { Request, Response, NextFunction } from "express";
import * as opportunityService from "./opportunity.service";
import { AuthRequest } from "../../types/auth-request";

export const getSectorsWithCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.query;

    const result = await opportunityService.getMappedSectorsWithCount(
      status as string | undefined,
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const listOpportunities = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = req.body;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User ID is required");
    }
    const result = await opportunityService.getOpportunities(body, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getOpportunityDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid opportunity ID" });
    }

    const { ai_decision } = req.query; 
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User ID is required");
    }
    const opportunity = await opportunityService.getOpportunityById(id, userId, ai_decision as string | undefined);
    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    res.json({ opportunity });
  } catch (err) {
    next(err);
  }
};
