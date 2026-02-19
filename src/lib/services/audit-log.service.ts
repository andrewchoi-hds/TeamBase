import prisma from "@/lib/prisma";
import { AuditAction, AuditEntityType, Prisma } from "@prisma/client";

interface AuditLogInput {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  userId?: string | null;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export const auditLogService = {
  async log(input: AuditLogInput) {
    return prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        userId: input.userId ?? null,
        changes: (input.changes as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  },

  async getByEntity(entityType: AuditEntityType, entityId: string, { limit = 50, offset = 0 } = {}) {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { entityType, entityId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where: { entityType, entityId } }),
    ]);
    return { logs, total };
  },

  async getByUser(userId: string, { limit = 50, offset = 0 } = {}) {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where: { userId } }),
    ]);
    return { logs, total };
  },
};
