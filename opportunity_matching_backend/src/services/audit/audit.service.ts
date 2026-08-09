import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type AuditInput = {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: input.actorId || null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId || null,
        metadata: input.metadata ?? undefined,
        ipAddress: input.ipAddress || null,
      },
    });
  } catch (err) {
    // Never fail the primary action because of audit write issues
    console.error("Failed to write audit log:", err);
    return null;
  }
}

export async function listAuditLogs(opts: {
  limit?: number;
  action?: string;
  entityType?: string;
}) {
  const take = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  return prisma.auditLog.findMany({
    where: {
      ...(opts.action ? { action: opts.action } : {}),
      ...(opts.entityType ? { entityType: opts.entityType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      actor: { select: { id: true, email: true, name: true } },
    },
  });
}
