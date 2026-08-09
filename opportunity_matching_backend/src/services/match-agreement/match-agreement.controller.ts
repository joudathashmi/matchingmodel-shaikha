import { Response } from "express";
import { MatchAgreementService } from "./match-agreement.service";
import { AuthRequest } from "../../types/auth-request";
import * as roleService from "../../modules/users/role.service";
import { hasAnyRole, ROLES } from "../../constants/roles";
import { writeAuditLog } from "../audit/audit.service";

const service = new MatchAgreementService();

const ALLOWED_STATUSES = [
  "Agreed",
  "Disagreed",
  "Engage",
  "PlanShared",
  "MoU",
  "Landed",
  "Hold",
  "Rejected",
] as const;

export class MatchAgreementController {
  async setAgreement(req: AuthRequest, res: Response) {
    try {
      const { matchId, status } = req.body;
      const userId = req.user?.userId;

      if (!userId) throw new Error("User ID is required");
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
        });
      }

      const agreement = await service.setAgreement(userId, matchId, status);
      await writeAuditLog({
        actorId: userId,
        action: "match_decision.set",
        entityType: "match_agreement",
        entityId: String(matchId),
        metadata: { status, agreementId: agreement.id },
        ipAddress: req.ip,
      });
      res.status(201).json(agreement);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteAgreement(req: AuthRequest, res: Response) {
    try {
      const { matchId } = req.body;
      const userId = req.user?.userId;

      if (!userId) throw new Error("User ID is required");

      await service.deleteAgreement(userId, matchId);
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async listAgreements(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("User ID is required");

      const { status, scope } = req.query;
      const roles = await roleService.getUserRoles(userId);
      const canSeeAll = hasAnyRole(roles, [ROLES.ADMIN, ROLES.REVIEWER]);

      if (scope === "all") {
        if (!canSeeAll) {
          return res.status(403).json({
            error: "Forbidden: reviewer or admin required for team-wide list",
          });
        }
        const agreements = await service.getAllAgreements(
          (status as any) || "all"
        );
        return res.json(agreements);
      }

      const agreements = await service.getUserAgreements(
        userId,
        (status as any) || "all"
      );
      res.json(agreements);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
