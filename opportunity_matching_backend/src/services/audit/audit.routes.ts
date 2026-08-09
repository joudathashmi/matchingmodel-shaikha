import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import * as auditService from "./audit.service";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole([ROLES.ADMIN]),
  async (req, res) => {
    const limit = req.query.limit
      ? Number(req.query.limit)
      : 50;
    const action =
      typeof req.query.action === "string" ? req.query.action : undefined;
    const entityType =
      typeof req.query.entityType === "string"
        ? req.query.entityType
        : undefined;

    const logs = await auditService.listAuditLogs({
      limit: Number.isFinite(limit) ? limit : 50,
      action,
      entityType,
    });

    res.json({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        metadata: l.metadata,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
        actor: l.actor
          ? { id: l.actor.id, email: l.actor.email, name: l.actor.name }
          : null,
      })),
    });
  }
);

export default router;
