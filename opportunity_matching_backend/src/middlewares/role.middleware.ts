// src/middlewares/role.middleware.ts
import { AuthRequest } from "../types/auth-request";
import { Response, NextFunction } from "express";
import { prisma } from "./../lib/prisma";


export function requireRole(roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userRoles = await prisma.userRole.findMany({
      where: { userId: req.user.userId },
      include: { role: true },
    });

    const roleNames = userRoles.map(r => r.role.name);

    const hasRole = roles.some(role => roleNames.includes(role));
    if (!hasRole) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }

    next();
  };
}