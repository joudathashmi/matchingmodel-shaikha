import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import * as control from "./identity-provider.controller";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole([ROLES.ADMIN]),
  control.getIdentityProvider
);

router.put(
  "/",
  requireAuth,
  requireRole([ROLES.ADMIN]),
  control.putIdentityProvider
);

export default router;
