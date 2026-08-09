import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { writeAuditLog } from "../../services/audit/audit.service";
import * as identityService from "./identity-provider.service";
import { IdentityProviderConfig } from "./identity-provider.types";

export async function getIdentityProvider(req: AuthRequest, res: Response) {
  const config = await identityService.getIdentityProviderConfig();
  res.json({
    config,
    runtime: {
      envSsoEnabled: String(process.env.ENABLE_SSO || "").toLowerCase() === "true",
      envSsoProvider: process.env.SSO_PROVIDER || "nafath",
      note:
        "Saving parameters here prepares Active Directory / enterprise SSO. Live sign-in still requires ENABLE_SSO and provider wiring.",
    },
  });
}

export async function putIdentityProvider(req: AuthRequest, res: Response) {
  const body = (req.body || {}) as Partial<IdentityProviderConfig>;
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const config = await identityService.saveIdentityProviderConfig(body, userId);

  await writeAuditLog({
    actorId: userId,
    action: "identity_provider.update",
    entityType: "AppSetting",
    entityId: "identity_provider",
    metadata: {
      prepared: config.prepared,
      protocol: config.protocol,
      displayName: config.displayName,
      hasClientSecret: config.hasClientSecret,
    },
    ipAddress: req.ip,
  });

  res.json({
    config,
    message: config.prepared
      ? "Active Directory parameters saved and marked ready for integration."
      : "Active Directory parameters saved (not marked ready yet).",
  });
}
