import { describe, it, expect, vi, beforeEach } from "vitest";
import { notificationService } from "@/lib/services/notification.service";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";

describe("NotificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("알림을 생성한다", async () => {
      const input = {
        userId: "user-1",
        type: "FEEDBACK_RECEIVED" as const,
        title: "새 피드백",
        message: "피드백이 도착했습니다.",
      };
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: "noti-1", ...input, isRead: false, link: null, createdAt: new Date() } as any);

      const result = await notificationService.create(input);
      expect(prisma.notification.create).toHaveBeenCalledWith({ data: input });
      expect(result.id).toBe("noti-1");
    });
  });

  describe("createMany", () => {
    it("여러 알림을 일괄 생성한다", async () => {
      const inputs = [
        { userId: "user-1", type: "REVIEW_REQUESTED" as const, title: "t1", message: "m1" },
        { userId: "user-2", type: "REVIEW_REQUESTED" as const, title: "t2", message: "m2" },
      ];
      vi.mocked(prisma.notification.createMany).mockResolvedValue({ count: 2 });

      await notificationService.createMany(inputs);
      expect(prisma.notification.createMany).toHaveBeenCalledWith({ data: inputs });
    });
  });

  describe("getByUserId", () => {
    it("사용자의 알림을 조회한다", async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValue([]);
      vi.mocked(prisma.notification.count).mockResolvedValue(0);

      const result = await notificationService.getByUserId("user-1");
      expect(result).toEqual({ notifications: [], total: 0 });
    });

    it("isRead 필터를 적용한다", async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValue([]);
      vi.mocked(prisma.notification.count).mockResolvedValue(0);

      await notificationService.getByUserId("user-1", { isRead: false });
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1", isRead: false },
        })
      );
    });
  });

  describe("getUnreadCount", () => {
    it("미읽음 개수를 반환한다", async () => {
      vi.mocked(prisma.notification.count).mockResolvedValue(5);

      const count = await notificationService.getUnreadCount("user-1");
      expect(count).toBe(5);
    });
  });

  describe("markAsRead", () => {
    it("개별 알림을 읽음 처리한다", async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 1 });

      await notificationService.markAsRead("noti-1", "user-1");
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: "noti-1", userId: "user-1" },
        data: { isRead: true },
      });
    });
  });

  describe("markAllAsRead", () => {
    it("모든 알림을 읽음 처리한다", async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 3 });

      await notificationService.markAllAsRead("user-1");
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", isRead: false },
        data: { isRead: true },
      });
    });
  });
});
