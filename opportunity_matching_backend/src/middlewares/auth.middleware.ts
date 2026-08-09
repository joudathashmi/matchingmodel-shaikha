// src\middlewares\auth.middleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from "./../lib/prisma";


// Extend Express Request type
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email?: string;
    sessionId?: string;
    roles?: string[];
  };
}

export const requireAuth: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify token
    const payload = verifyAccessToken(token) as {
      userId: string;
      email?: string;
      sessionId?: string;
    };

    if (!payload?.userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Fetch roles
    const roles = await prisma.role.findMany({
      where: { users: { some: { id: payload.userId } } },
      select: { name: true },
    });

    // Populate req.user
    (req as AuthRequest).user = {
      userId: payload.userId,
      email: payload.email,
      sessionId: payload.sessionId,
      roles: roles.map((r) => r.name),
    };

    // 🕒 Update lastActiveAt in Session table
    if (payload.sessionId) {
      await prisma.session.update({
        where: { id: payload.sessionId },
        data: { lastActivity: new Date() },
      });
    }

    next();
  } catch (err: any) {
    console.error("Auth error:", err);
    console.error("Auth error Code:", err.code);
    console.error("Auth error Name:", err.name);
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (err.name === "PrismaClientInitializationError" || err.code === "P1001" || err.code === "P1012") {
      return res.status(500).json({ message: "Database connection failed" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};
