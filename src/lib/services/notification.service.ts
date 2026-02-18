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
};
