// src/services/bookmark/bookmark.controller.ts
import { Request, Response } from "express";
import { BookmarkService } from "./bookmark.service";
import { AuthRequest } from "../../types/auth-request";

const bookmarkService = new BookmarkService();

export class BookmarkController {
    async create(req: AuthRequest, res: Response) {
        try {
            const { entityId, entityType } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                throw new Error("User ID is required");
            }
            if (entityType !== "opportunity" && entityType !== "company" && entityType !== "match") {
                return res.status(400).json({ error: "Invalid entityType. Must be 'opportunity' or 'company'" });
            }
            const bookmark = await bookmarkService.createBookmark(userId, entityId, entityType);
            res.status(201).json(bookmark);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    async delete(req: AuthRequest, res: Response) {
        try {
            const { entityId, entityType } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                throw new Error("User ID is required");
            }
            if (entityType !== "opportunity" && entityType !== "company" && entityType !== "match") {
                return res.status(400).json({ error: "Invalid entityType. Must be 'opportunity' or 'company'" });
            }
            await bookmarkService.deleteBookmark(userId, entityId, entityType);
            res.status(204).send();
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    async list(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new Error("User ID is required");
            }
            const { entityType } = req.query;
            let normalizedType: "opportunity" | "company" | "match" | "all" = "all";
            if (entityType === "opportunity" || entityType === "company" || entityType === "match" || entityType === "all") {
                normalizedType = entityType;
            }
            const bookmarks = await bookmarkService.getUserBookmarks(userId, normalizedType);
            res.json(bookmarks);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
}
