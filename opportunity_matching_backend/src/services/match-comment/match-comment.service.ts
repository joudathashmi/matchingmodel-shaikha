import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MAX_BODY = 2000;

export async function listCommentsForMatch(matchId: number) {
  return prisma.matchComment.findMany({
    where: { matchId },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listCommentsForMatches(matchIds: number[]) {
  if (!matchIds.length) return [];
  return prisma.matchComment.findMany({
    where: { matchId: { in: matchIds } },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function addComment(userId: string, matchId: number, body: string) {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");
  if (trimmed.length > MAX_BODY) {
    throw new Error(`Comment must be at most ${MAX_BODY} characters`);
  }

  const match = await prisma.matchingOutput.findUnique({
    where: { id: matchId },
    select: { id: true },
  });
  if (!match) throw new Error("Match not found");

  return prisma.matchComment.create({
    data: { userId, matchId, body: trimmed },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function deleteComment(userId: string, commentId: string, isAdmin: boolean) {
  const existing = await prisma.matchComment.findUnique({
    where: { id: commentId },
  });
  if (!existing) throw new Error("Comment not found");
  if (!isAdmin && existing.userId !== userId) {
    throw new Error("You can only delete your own comments");
  }
  await prisma.matchComment.delete({ where: { id: commentId } });
}

export function serializeComment(c: {
  id: string;
  matchId: number;
  body: string;
  createdAt: Date;
  user: { id: string; name: string | null; email: string };
}) {
  return {
    id: c.id,
    matchId: c.matchId,
    body: c.body,
    createdAt: c.createdAt,
    author: {
      id: c.user.id,
      name: c.user.name,
      email: c.user.email,
    },
  };
}
