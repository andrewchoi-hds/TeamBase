import { describe, it, expect, vi, beforeEach } from "vitest";
import { accessLogService } from "@/lib/services/access-log.service";

vi.mock("@/lib/prisma", () => ({
  default: {
    accessLog: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/services/notification.service", () => ({
  notificationService: { create: vi.fn() },
}));

import prisma from "@/lib/prisma";
import { notificationService } from "@/lib/services/notification.service";

describe("AccessLogService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("log", () => {
    it("접근 로그를 기록하고 알림을 전송한다", async () => {
      vi.mocked(prisma.accessLog.create).mockResolvedValue({ id: "log-1" } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: "뷰어" } as any);

      const result = await accessLogService.log({
        viewerId: "viewer-1",
        targetId: "target-1",
        resourceType: "PROFILE" as any,
      });

      expect(prisma.accessLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          viewerId: "viewer-1",
          targetId: "target-1",
          notificationSent: true,
        }),
      });
      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "target-1",
          type: "ACCESS_LOG_ALERT",
        })
      );
      expect(result).toBeTruthy();
    });

    it("자기 자신 접근은 기록하지 않는다", async () => {
      const result = await accessLogService.log({
        viewerId: "user-1",
        targetId: "user-1",
        resourceType: "PROFILE" as any,
      });

      expect(result).toBeNull();
      expect(prisma.accessLog.create).not.toHaveBeenCalled();
    });
  });

  describe("getByTarget", () => {
    it("대상자의 접근 로그를 조회한다", async () => {
      vi.mocked(prisma.accessLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.accessLog.count).mockResolvedValue(0);

      const result = await accessLogService.getByTarget("target-1");
      expect(result).toEqual({ logs: [], total: 0 });
    });

    it("페이지네이션 파라미터를 전달한다", async () => {
      vi.mocked(prisma.accessLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.accessLog.count).mockResolvedValue(0);

      await accessLogService.getByTarget("target-1", { limit: 10, offset: 5 });
      expect(prisma.accessLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10, skip: 5 })
      );
    });
  });

  describe("getByViewer", () => {
    it("뷰어의 접근 로그를 조회한다", async () => {
      vi.mocked(prisma.accessLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.accessLog.count).mockResolvedValue(0);

      const result = await accessLogService.getByViewer("viewer-1");
      expect(result).toEqual({ logs: [], total: 0 });
    });
  });
});
