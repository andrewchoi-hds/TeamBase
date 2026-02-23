import prisma from "@/lib/prisma";
import { ResourceType } from "@prisma/client";
import { notificationService } from "./notification.service";

interface LogAccessInput {
  viewerId: string;
  targetId: string;
  resourceType: ResourceType;
  resourceId?: string;
}

const resourceTypeLabels: Record<ResourceType, string> = {
  REVIEW: "평가",
  FEEDBACK: "피드백",
  PROFILE: "프로필",
};

export const accessLogService = {
  async log(input: LogAccessInput) {
    // Don't log self-access
    if (input.viewerId === input.targetId) return null;

    const [log, viewer] = await Promise.all([
      prisma.accessLog.create({ data: { ...input, notificationSent: true } }),
      prisma.user.findUnique({ where: { id: input.viewerId }, select: { name: true } }),
    ]);

    // Send notification to target
    await notificationService.create({
      userId: input.targetId,
      type: "ACCESS_LOG_ALERT",
      title: "열람 알림",
      message: `${viewer?.name ?? "누군가"}님이 회원님의 ${resourceTypeLabels[input.resourceType]} 정보를 열람했습니다.`,
      link: "/notifications",
    });

    return log;
  },

  async getByTarget(targetId: string, { limit = 20, offset = 0 } = {}) {
    const [logs, total] = await Promise.all([
      prisma.accessLog.findMany({
        where: { targetId },
        include: { viewer: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.accessLog.count({ where: { targetId } }),
    ]);
    return { logs, total };
  },

  async getByViewer(viewerId: string, { limit = 20, offset = 0 } = {}) {
    const [logs, total] = await Promise.all([
      prisma.accessLog.findMany({
        where: { viewerId },
        include: { target: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.accessLog.count({ where: { viewerId } }),
    ]);
    return { logs, total };
  },
};
