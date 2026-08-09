// src\modules\auth\auth.controller.ts
import { Request, Response, NextFunction } from "express";
import * as userService from "../users/user.service";
import { verifyRefreshToken, getRefreshCookieOptions } from "../../utils/jwt";
import * as sessionService from "../users/session.service";
import * as roleService from "../users/role.service";
import { AuthRequest } from "../../types/auth-request";
import { getSsoProvider, isSsoEnabled } from "../../config/features";
import logger from "../../utils/logger";
import { prisma } from "./../../lib/prisma";


const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || "refreshToken";

/** Public self-registration is disabled — admins create accounts. */
export const register = async (_req: Request, res: Response) => {
  return res.status(403).json({
    message:
      "Public sign-up is disabled. Ask an administrator to create your account.",
  });
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await userService.findUserByEmail(
      String(email).trim().toLowerCase()
    );
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await userService.verifyPassword(user, password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const { accessToken, refreshToken } =
      await userService.createTokensForUser(user);

    await sessionService.createSession(user.id, req.ip, req.headers["user-agent"]);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        mustChangePassword: Boolean(user.mustChangePassword),
      },
      accessToken,
      mustChangePassword: Boolean(user.mustChangePassword),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Self-service email reset is intentionally disabled until SMTP / enterprise
 * mail is wired. Officers must ask an admin (Settings → Users) or DBI.
 */
export const forgotPassword = async (_req: Request, res: Response) => {
  return res.status(503).json({
    message:
      "Self-service password reset is not available. Ask an administrator to set a temporary password, or contact DBI@misa.gov.sa.",
  });
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password } = req.body;
    const user = await userService.resetPasswordWithToken(token, password);
    if (!user) {
      return res.status(400).json({
        message: "Reset link is invalid or has expired. Request a new one.",
      });
    }
    res.json({
      message: "Password updated. You can sign in with your new password.",
    });
  } catch (err) {
    next(err);
  }
};

/** Authenticated change (first login or voluntary). */
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { currentPassword, newPassword } = req.body;
    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from the current password.",
      });
    }
    const result = await userService.changePasswordAuthenticated(
      req.user.userId,
      currentPassword,
      newPassword
    );
    if (!result.ok) {
      if (result.reason === "bad_current") {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      message: "Password updated",
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        mustChangePassword: false,
      },
      mustChangePassword: false,
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const payload: any = verifyRefreshToken(token);
    if (!payload?.userId) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newRefresh = await userService.rotateRefreshToken(token, payload.userId);
    const accessToken = require("../../utils/jwt").signAccessToken({
      userId: payload.userId,
      email: payload.email,
    });

    res.cookie(REFRESH_COOKIE_NAME, newRefresh, getRefreshCookieOptions());
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME];

    if (token) {
      await userService.revokeRefreshToken(token);
    }

    if (req.user?.sessionId) {
      await prisma.session.update({
        where: { id: req.user.sessionId },
        data: { loggedOutAt: new Date() },
      });
    }

    res.clearCookie(REFRESH_COOKIE_NAME, {
      path: process.env.REFRESH_COOKIE_PATH || "/",
    });

    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

export const getUserRoles = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const roles = await roleService.getUserRoles(req.user.userId);
  res.json({ roles });
};

export const getUserSessions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sessions = await prisma.session.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ sessions });
  } catch (err) {
    console.error("Error fetching user sessions:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const ssoStatus = async (_req: Request, res: Response) => {
  res.json({
    enabled: isSsoEnabled(),
    provider: getSsoProvider(),
    message: isSsoEnabled()
      ? "SSO is enabled for this environment."
      : "SSO is configured but not enabled. Use email/password sign-in.",
  });
};

export const ssoStart = async (_req: Request, res: Response) => {
  if (!isSsoEnabled()) {
    return res.status(503).json({
      enabled: false,
      provider: getSsoProvider(),
      message: "SSO is not enabled. Set ENABLE_SSO=true to activate.",
    });
  }

  res.json({
    enabled: true,
    provider: getSsoProvider(),
    message: "SSO start endpoint ready - wire provider redirect when activating.",
    redirectUrl: null,
  });
};

export const nafath_callback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!isSsoEnabled()) {
      return res.status(503).json({
        success: false,
        enabled: false,
        message: "SSO/Nafath callback received but SSO is not enabled.",
      });
    }

    // Do not log or echo identity payload — acknowledge receipt only.
    logger.info({ provider: "nafath" }, "SSO callback received");

    res.json({
      success: true,
      message: "Nafath authentication data received successfully.",
    });
  } catch (err) {
    next(err);
  }
};
