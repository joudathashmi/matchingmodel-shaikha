// src\modules\users\user.service.ts
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import crypto from "crypto";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  parseExpiryToMs,
} from "../../utils/jwt";
import dayjs from "dayjs";

const prisma = new PrismaClient();

const RESET_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 60);

export const createUser = async (data: {
  email: string;
  password: string;
  name?: string;
  mustChangePassword?: boolean;
}) => {
  const passwordHash = await argon2.hash(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      mustChangePassword: data.mustChangePassword ?? true,
    },
  });
  return user;
};

export const findUserByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });

export const findUserById = (id: string) =>
  prisma.user.findUnique({ where: { id } });

export const verifyPassword = async (user: any, password: string) => {
  return argon2.verify(user.passwordHash, password);
};

export const updateUserPassword = async (
  userId: string,
  password: string,
  opts?: { clearMustChange?: boolean; clearResetToken?: boolean }
) => {
  const passwordHash = await argon2.hash(password);
  return prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      ...(opts?.clearMustChange ? { mustChangePassword: false } : {}),
      ...(opts?.clearResetToken
        ? { passwordResetTokenHash: null, passwordResetExpires: null }
        : {}),
    },
  });
};

/** Admin sets a temporary password — user must change it next login. */
export const adminSetPassword = async (userId: string, password: string) => {
  const passwordHash = await argon2.hash(password);
  return prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: true,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
    },
  });
};

export const updateUserProfile = async (
  userId: string,
  data: { name?: string | null; email?: string }
) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
    },
  });
};

/** Remove user and dependent rows (no cascade in schema). */
export const deleteUserById = async (userId: string) => {
  await prisma.$transaction([
    prisma.bookmark.deleteMany({ where: { userId } }),
    prisma.matchAgreement.deleteMany({ where: { userId } }),
    prisma.refreshToken.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.userRole.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
};

function hashResetToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Issue a one-time password reset token (raw returned once for email/link).
 * Always call even when you will not reveal whether the email exists.
 */
export const issuePasswordResetToken = async (email: string) => {
  const normalized = email.trim().toLowerCase();
  const user = await findUserByEmail(normalized);
  if (!user) return null;

  const raw = crypto.randomBytes(32).toString("hex");
  const passwordResetTokenHash = hashResetToken(raw);
  const passwordResetExpires = dayjs().add(RESET_TTL_MINUTES, "minute").toDate();

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetTokenHash, passwordResetExpires },
  });

  return { user, rawToken: raw, expiresAt: passwordResetExpires };
};

export const resetPasswordWithToken = async (rawToken: string, newPassword: string) => {
  const passwordResetTokenHash = hashResetToken(rawToken);
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash,
      passwordResetExpires: { gt: new Date() },
    },
  });
  if (!user) return null;

  await updateUserPassword(user.id, newPassword, {
    clearMustChange: true,
    clearResetToken: true,
  });
  // Invalidate sessions/refresh tokens after reset
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  await prisma.session.updateMany({
    where: { userId: user.id, loggedOutAt: null },
    data: { loggedOutAt: new Date(), isActive: false },
  });
  return user;
};

export const changePasswordAuthenticated = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await findUserById(userId);
  if (!user) return { ok: false as const, reason: "not_found" };
  const valid = await verifyPassword(user, currentPassword);
  if (!valid) return { ok: false as const, reason: "bad_current" };
  await updateUserPassword(userId, newPassword, {
    clearMustChange: true,
    clearResetToken: true,
  });
  return { ok: true as const, user };
};

export const createTokensForUser = async (user: any) => {
  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email });

  const refreshTokenHash = await argon2.hash(refreshToken);
  const expiresAt = dayjs()
    .add(
      parseExpiryToMs(process.env.REFRESH_TOKEN_EXPIRES_IN || "7d") /
        (24 * 60 * 60 * 1000),
      "day"
    )
    .toDate();

  // Keep one active refresh token per user so logout/refresh stay O(1).
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      expiresAt,
      userId: user.id,
    },
  });

  return { accessToken, refreshToken };
};

export const rotateRefreshToken = async (oldToken: string, userId: string) => {
  const tokens = await prisma.refreshToken.findMany({ where: { userId } });
  for (const t of tokens) {
    const match = await argon2.verify(t.tokenHash, oldToken).catch(() => false);
    if (match) {
      await prisma.refreshToken.delete({ where: { id: t.id } });
      const newRefresh = signRefreshToken({ userId });
      const newHash = await argon2.hash(newRefresh);
      const expiresAt = dayjs()
        .add(
          parseExpiryToMs(process.env.REFRESH_TOKEN_EXPIRES_IN || "7d") /
            (24 * 60 * 60 * 1000),
          "day"
        )
        .toDate();
      await prisma.refreshToken.create({
        data: { tokenHash: newHash, expiresAt, userId },
      });
      return newRefresh;
    }
  }
  throw new Error("Refresh token not found");
};

export const revokeRefreshToken = async (token: string) => {
  // Never argon2-scan the whole table. Verify the JWT, then delete that user's rows.
  try {
    const payload = verifyRefreshToken(token) as { userId?: string };
    if (!payload?.userId) return false;
    const result = await prisma.refreshToken.deleteMany({
      where: { userId: payload.userId },
    });
    return result.count > 0;
  } catch {
    return false;
  }
};
