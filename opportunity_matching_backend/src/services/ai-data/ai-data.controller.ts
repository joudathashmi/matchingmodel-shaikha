// src\services\ai-data\ai-data.controller.ts
import { Request, Response, NextFunction } from "express";
import * as aiDataService from "./ai-data.services";
import * as chatService from "./chat.service";

export async function getPageAIData(req: Request, res: Response) {
  try {
    const { page } = req.params;
    const data = await aiDataService.getPageAIData(page)
    res.json(data);
  } catch (error: any) {
    console.error("Error fetching insights:", error);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
}

export async function postChat(req: Request, res: Response) {
  try {
    const { message, matchId, page, history } = req.body || {};
    const parsedMatchId =
      matchId === null || matchId === undefined || matchId === ""
        ? null
        : Number(matchId);
    const result = await chatService.chat({
      message: String(message || ""),
      matchId:
        typeof parsedMatchId === "number" && !Number.isNaN(parsedMatchId)
          ? parsedMatchId
          : null,
      page: typeof page === "string" ? page : null,
      history: Array.isArray(history) ? history : [],
    });
    res.json(result);
  } catch (error: any) {
    const msg = error?.message || "Failed to chat";
    const status = /required|at most/i.test(msg) ? 400 : 500;
    if (status === 500) console.error("Error in IPA chat:", error);
    res.status(status).json({ message: msg });
  }
}