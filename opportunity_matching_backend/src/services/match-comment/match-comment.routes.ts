import { Router } from "express";
import { requireAuth, AuthRequest } from "../../middlewares/auth.middleware";
import * as roleService from "../../modules/users/role.service";
import { hasAnyRole, ROLES } from "../../constants/roles";
import * as commentService from "./match-comment.service";

const router = Router();

/** GET /api/match-comments?matchId=123  or  ?matchIds=1,2,3 */
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const matchIdRaw = req.query.matchId;
    const matchIdsRaw = req.query.matchIds;

    if (typeof matchIdsRaw === "string" && matchIdsRaw.trim()) {
      const ids = matchIdsRaw
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
      const rows = await commentService.listCommentsForMatches(ids);
      return res.json({
        comments: rows.map(commentService.serializeComment),
      });
    }

    const matchId = Number(matchIdRaw);
    if (!Number.isFinite(matchId) || matchId <= 0) {
      return res.status(400).json({ message: "matchId or matchIds is required" });
    }

    const rows = await commentService.listCommentsForMatch(matchId);
    res.json({ comments: rows.map(commentService.serializeComment) });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to load comments" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const matchId = Number(req.body?.matchId);
    const body = typeof req.body?.body === "string" ? req.body.body : "";

    if (!Number.isFinite(matchId) || matchId <= 0) {
      return res.status(400).json({ message: "matchId is required" });
    }

    const created = await commentService.addComment(userId, matchId, body);
    res.status(201).json({ comment: commentService.serializeComment(created) });
  } catch (err: any) {
    const status = err.message?.includes("empty") || err.message?.includes("at most")
      ? 400
      : err.message === "Match not found"
        ? 404
        : 500;
    res.status(status).json({ message: err.message || "Failed to add comment" });
  }
});

router.delete("/:commentId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const roles = await roleService.getUserRoles(userId);
    const isAdmin = hasAnyRole(roles, [ROLES.ADMIN]);

    await commentService.deleteComment(userId, req.params.commentId, isAdmin);
    res.status(204).send();
  } catch (err: any) {
    const status =
      err.message === "Comment not found"
        ? 404
        : err.message?.includes("only delete")
          ? 403
          : 500;
    res.status(status).json({ message: err.message || "Failed to delete comment" });
  }
});

export default router;
