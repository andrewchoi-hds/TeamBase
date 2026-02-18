import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNextRequest } from "@/__tests__/helpers/api-test-utils";

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: vi.fn(),
  unauthorized: () => {
    const { NextResponse } = require("next/server");
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  },
}));

vi.mock("@/lib/services/notification.service", () => ({
  notificationService: {
    getByUserId: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

import { getCurrentUser } from "@/lib/auth-utils";
import { notificationService } from "@/lib/services/notification.service";

describe("Notifications API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/notifications", () => {
    it("인증되지 않으면 401을 반환한다", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const { GET } = await import("@/app/api/notifications/route");
      const req = createNextRequest("/api/notifications");

      const res = await GET(req, { params: {} } as any);
      expect(res.status).toBe(401);
    });

    it("알림 목록을 반환한다", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-1", email: "a@b.com", name: "테스트", role: "MEMBER" as const,
      });
      vi.mocked(notificationService.getByUserId).mockResolvedValue({
        notifications: [{ id: "n1", title: "알림1" }],
        total: 1,
      } as any);

      const { GET } = await import("@/app/api/notifications/route");
      const req = createNextRequest("/api/notifications");

      const res = await GET(req, { params: {} } as any);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.notifications).toHaveLength(1);
    });
  });
});
