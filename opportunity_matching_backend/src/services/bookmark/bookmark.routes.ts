// src/services/bookmark/bookmark.routes.ts
import { Router } from "express";
import { BookmarkController } from "./bookmark.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();
const controller = new BookmarkController();

router.post("/", requireAuth, controller.create.bind(controller));
router.delete("/", requireAuth, controller.delete.bind(controller));
router.get("/", requireAuth, controller.list.bind(controller));

export default router;
