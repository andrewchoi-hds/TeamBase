import prisma from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { sendEmail } from "@/lib/email/send-email";
import { getEmailTemplate, EMAIL_TYPES } from "@/lib/email/templates";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export const notificationService = {
  async create(input: CreateNotificationInput) {
    const notification = await prisma.notification.create({ data: input });

    if (EMAIL_TYPES.includes(input.type)) {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { email: true, name: true },
      });
      if (user?.email) {
        const html = getEmailTemplate(input.type, {
          title: input.title,
          message: input.message,
          link: input.link,
          userName: user.name,
        });
        if (html) {
          await sendEmail({ to: user.email, subject: input.title, html });
        }
      }
    }

    return notification;
  },

  async createMany(inputs: CreateNotificationInput[]) {
    const result = await prisma.notification.createMany({ data: inputs });

    // 이메일 대상 알림만 필터링하여 비동기 발송
    const emailTargets = inputs.filter((i) => EMAIL_TYPES.includes(i.type));
    if (emailTargets.length > 0) {
      const userIds = Array.from(new Set(emailTargets.map((i) => i.userId)));
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      await Promise.allSettled(
        emailTargets.map((input) => {
          const user = userMap.get(input.userId);
          if (!user?.email) return Promise.resolve();
          const html = getEmailTemplate(input.type, {
            title: input.title,
            message: input.message,
            link: input.link,
            userName: user.name,
          });
          if (!html) return Promise.resolve();
          return sendEmail({ to: user.email, subject: input.title, html });
        })
      );
    }

    return result;
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
