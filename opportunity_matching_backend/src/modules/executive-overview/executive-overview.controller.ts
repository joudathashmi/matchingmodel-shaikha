import { Request, Response, NextFunction } from "express";
import * as executiveOverviewService from "./executive-overview.service";
import { topOpportunitiesSchema } from "../../validations/executive-overview.schema";

export const getSectorsWithCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ai_decision, topRank } = req.query;

    const result = await executiveOverviewService.getMappedSectorsWithCount(
      ai_decision as string | undefined,
      topRank ? Number(topRank) : undefined
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getTopOpportunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = topOpportunitiesSchema.parse(req.body);

    const result = await executiveOverviewService.getTopMatchOpportunities(body.sectors, body.page, body.limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
};