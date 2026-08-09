// src\modules\auth\auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as userService from '../users/user.service';
import { verifyRefreshToken, getRefreshCookieOptions } from '../../utils/jwt';
import logger from '../../utils/logger';
import * as sessionService from '../users/session.service';
import * as roleService from '../users/role.service';
import { AuthRequest } from "../../types/auth-request";
import { PrismaClient } from '@prisma/client';
import { getSsoProvider, isSsoEnabled } from '../../config/features';

const prisma = new PrismaClient();

const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refreshToken';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    const existing = await userService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const user = await userService.createUser({ email, password, name });

    // Default role for new accounts
    await roleService.assignRoleToUser(user.id, 'officer');

    const { accessToken, refreshToken } = await userService.createTokensForUser(user);

    // Create session
    await sessionService.createSession(user.id, req.ip, req.headers['user-agent']);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await userService.findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await userService.verifyPassword(user, password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const { accessToken, refreshToken } = await userService.createTokensForUser(user);

    // Create session
    await sessionService.createSession(user.id, req.ip, req.headers['user-agent']);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    const payload: any = verifyRefreshToken(token);
    if (!payload?.userId) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const newRefresh = await userService.rotateRefreshToken(token, payload.userId);
    const accessToken = require('../../utils/jwt').signAccessToken({
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
      path: process.env.REFRESH_COOKIE_PATH || '/',
    });

    res.json({ message: 'Logged out' });
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

/** Public status - SSO is implemented but off unless ENABLE_SSO=true */
export const ssoStatus = async (_req: Request, res: Response) => {
  res.json({
    enabled: isSsoEnabled(),
    provider: getSsoProvider(),
    message: isSsoEnabled()
      ? 'SSO is enabled for this environment.'
      : 'SSO is configured but not enabled. Use email/password sign-in.',
  });
};

/** Start SSO/Nafath flow - returns 503 while disabled */
export const ssoStart = async (_req: Request, res: Response) => {
  if (!isSsoEnabled()) {
    return res.status(503).json({
      enabled: false,
      provider: getSsoProvider(),
      message: 'SSO is not enabled. Set ENABLE_SSO=true to activate.',
    });
  }

  // Placeholder for real Nafath redirect URL construction
  res.json({
    enabled: true,
    provider: getSsoProvider(),
    message: 'SSO start endpoint ready - wire provider redirect when activating.',
    redirectUrl: null,
  });
};

export const nafath_callback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isSsoEnabled()) {
      return res.status(503).json({
        success: false,
        enabled: false,
        message: 'SSO/Nafath callback received but SSO is not enabled.',
      });
    }

    console.log('Received Nafath callback:', req.body);

    // Stub: accept payload for integration testing; full user provisioning comes next
    res.json({
      success: true,
      message: 'Nafath authentication data received successfully.',
      data: req.body,
    });
  } catch (err) {
    next(err);
  }
};