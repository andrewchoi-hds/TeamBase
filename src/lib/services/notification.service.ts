import prisma from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export const notificationService = {
  async create(input: CreateNotificationInput) {
    return prisma.notification.create({ data: input });
  },

  async createMany(inputs: CreateNotificationInput[]) {
    return prisma.notification.createMany({ data: inputs });
  },

  async getByUserId(userId: string, { isRead, limit = 20, offset = 0 }: { isRead?: boolean; limit?: number; offset?: number } = {}) {
    const where = { userId, ...(isRead !== undefined ? { isRead } : {}) };
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);
    return { notifications, total };
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  /** 같은 날 동일 (userId, type, link) 알림이 있는지 확인 (중복 방지) */
  async existsToday(userId: string, type: NotificationType, link?: string): Promise<boolean> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const count = await prisma.notification.count({
      where: {
        userId,
        type,
        ...(link ? { link } : {}),
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });
    return count > 0;
  },
};
