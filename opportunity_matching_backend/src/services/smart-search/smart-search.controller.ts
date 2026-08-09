// src\services\smart-search\smart-search.controller.ts
import { Request, Response, NextFunction } from "express";
import * as smartSearchService from "./smart-search.services";

export const search = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: "Missing query parameter `q`" });
    }

    const results = await smartSearchService.smartSearch(q as string);
    res.json({ query: q, results });
  } catch (err) {
    next(err);
  }
};