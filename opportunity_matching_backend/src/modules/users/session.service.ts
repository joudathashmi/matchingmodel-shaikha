// src\modules\users\session.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createSession(userId: string, ipAddress?: string, userAgent?: string) {
  return prisma.session.create({
    data: {
      userId,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h session
    },
  });
}

export async function updateSessionActivity(sessionId: string) {
  return prisma.session.update({
    where: { id: sessionId },
    data: { lastActivity: new Date() },
  });
}

export async function endSession(sessionId: string) {
  return prisma.session.update({
    where: { id: sessionId },
    data: { loggedOutAt: new Date(), isActive: false },
  });
}
