import { Router } from "express";
import { requireAuth, AuthRequest } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { PrismaClient } from "@prisma/client";
import { isAppRole, ROLES, type AppRole } from "../../constants/roles";
import * as roleService from "./role.service";
import * as userService from "./user.service";
import { writeAuditLog } from "../../services/audit/audit.service";

const prisma = new PrismaClient();
const router = Router();

const userSelect = {
  id: true,
  email: true,
  name: true,
  mustChangePassword: true,
  roles: { select: { role: { select: { name: true } } } },
} as const;

function flattenUser(user: {
  id: string;
  email: string;
  name: string | null;
  mustChangePassword?: boolean;
  roles: { role: { name: string } }[];
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    mustChangePassword: Boolean(user.mustChangePassword),
    roles: user.roles.map((ur) => ur.role.name),
  };
}

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: flattenUser(user) });
});

router.get(
  "/roles",
  requireAuth,
  requireRole([ROLES.ADMIN]),
  async (_req, res) => {
    res.json({ roles: roleService.listRoleCatalog() });
  }
);

router.get(
  "/all",
  requireAuth,
  requireRole([ROLES.ADMIN]),
  async (_req, res) => {
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { email: "asc" },
    });
    res.json({ users: users.map(flattenUser) });
  }
);

/** Admin: create user with role */
router.post(
  "/",
  requireAuth,
  requireRole([ROLES.ADMIN]),
  async (req: AuthRequest, res) => {
    try {
      const { email, password, name, role } = req.body as {
        email?: string;
        password?: string;
        name?: string;
        role?: string;
      };

      if (!email || !password) {
        return res.status(400).json({
          message: "email and password are required",
        });
      }
      if (typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ message: "Invalid email address" });
      }
      if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters",
        });
      }

      const assignedRole: AppRole =
        role && isAppRole(role) ? role : ROLES.OFFICER;

      const existing = await userService.findUserByEmail(email.trim().toLowerCase());
      if (existing) {
        return res.status(409).json({ message: "Email already in use" });
      }

      const user = await userService.createUser({
        email: email.trim().toLowerCase(),
        password,
        name: name?.trim() || undefined,
        mustChangePassword: true,
      });
      await roleService.setUserRole(user.id, assignedRole);

      await writeAuditLog({
        actorId: req.user?.userId,
        action: "user.create",
        entityType: "user",
        entityId: user.id,
        metadata: {
          email: user.email,
          role: assignedRole,
          mustChangePassword: true,
        },
        ipAddress: req.ip,
      });

      const created = await prisma.user.findUnique({
        where: { id: user.id },
        select: userSelect,
      });

      res.status(201).json({ user: created ? flattenUser(created) : null });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to create user" });
    }
  }
);

router.patch(
  "/:userId/role",
  requireAuth,
  requireRole([ROLES.ADMIN]),
  async (req: AuthRequest, res) => {
    const { userId } = req.params;
    const { role } = req.body as { role?: string };

    if (!role || !isAppRole(role)) {
      return res.status(400).json({
        message: "role must be one of: officer, reviewer, admin",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.user?.userId === userId && role !== ROLES.ADMIN) {
      return res.status(400).json({
        message: "You cannot remove your own admin role",
      });
    }

    const previousRoles = await roleService.getUserRoles(userId);
    await roleService.setUserRole(userId, role);

    await writeAuditLog({
      actorId: req.user?.userId,
      action: "user.role_change",
      entityType: "user",
      entityId: userId,
      metadata: { from: previousRoles, to: role, email: user.email },
      ipAddress: req.ip,
    });

    const updated = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    res.json({ user: updated ? flattenUser(updated) : null });
  }
);

/** Admin: update name / email / password */
router.patch(
  "/:userId",
  requireAuth,
  requireRole([ROLES.ADMIN]),
  async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const { name, email, password } = req.body as {
        name?: string;
        email?: string;
        password?: string;
      };

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (email !== undefined) {
        const next = email.trim().toLowerCase();
        if (!next.includes("@")) {
          return res.status(400).json({ message: "Invalid email address" });
        }
        if (next !== user.email) {
          const taken = await userService.findUserByEmail(next);
          if (taken) {
            return res.status(409).json({ message: "Email already in use" });
          }
        }
        await userService.updateUserProfile(userId, { email: next });
      }

      if (name !== undefined) {
        await userService.updateUserProfile(userId, {
          name: name.trim() || null,
        });
      }

      if (password !== undefined) {
        if (typeof password !== "string" || password.length < 8) {
          return res.status(400).json({
            message: "Password must be at least 8 characters",
          });
        }
        // Temporary admin password — force change on next login
        await userService.adminSetPassword(userId, password);
      }

      const updated = await prisma.user.findUnique({
        where: { id: userId },
        select: userSelect,
      });

      res.json({ user: updated ? flattenUser(updated) : null });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to update user" });
    }
  }
);

/** Admin: delete user */
router.delete(
  "/:userId",
  requireAuth,
  requireRole([ROLES.ADMIN]),
  async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;

      if (req.user?.userId === userId) {
        return res.status(400).json({
          message: "You cannot delete your own account",
        });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: "User not found" });

      await userService.deleteUserById(userId);
      await writeAuditLog({
        actorId: req.user?.userId,
        action: "user.delete",
        entityType: "user",
        entityId: userId,
        metadata: { email: user.email },
        ipAddress: req.ip,
      });
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to delete user" });
    }
  }
);

export default router;
