// src\modules\users\user.service.ts
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { signAccessToken, signRefreshToken, parseExpiryToMs } from '../../utils/jwt';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

export const createUser = async (data: { email: string; password: string; name?: string }) => {
  const passwordHash = await argon2.hash(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
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

export const updateUserPassword = async (userId: string, password: string) => {
  const passwordHash = await argon2.hash(password);
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
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

export const createTokensForUser = async (user: any) => {
  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email });

  const refreshTokenHash = await argon2.hash(refreshToken);
  const expiresAt = dayjs().add(parseExpiryToMs(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') / (24*60*60*1000), 'day').toDate();

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
  const tokens = await prisma.refreshToken.findMany({ where: { userId }});
  for (const t of tokens) {
    const match = await argon2.verify(t.tokenHash, oldToken).catch(()=>false);
    if (match) {
      await prisma.refreshToken.delete({ where: { id: t.id }});
      const newRefresh = signRefreshToken({ userId });
      const newHash = await argon2.hash(newRefresh);
      const expiresAt = dayjs().add(parseExpiryToMs(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') / (24*60*60*1000), 'day').toDate();
      await prisma.refreshToken.create({
        data: { tokenHash: newHash, expiresAt, userId }
      });
      return newRefresh;
    }
  }
  throw new Error('Refresh token not found');
};

export const revokeRefreshToken = async (token: string) => {
  const tokens = await prisma.refreshToken.findMany();
  for (const t of tokens) {
    const ok = await argon2.verify(t.tokenHash, token).catch(()=>false);
    if (ok) {
      await prisma.refreshToken.delete({ where: { id: t.id } });
      return true;
    }
  }
  return false;
};