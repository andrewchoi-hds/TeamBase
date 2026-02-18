import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNextRequest } from "@/__tests__/helpers/api-test-utils";

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: vi.fn(),
  unauthorized: () => {
    const { NextResponse } = require("next/server");
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    identifiedFeedback: { findMany: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/lib/services/notification.service", () => ({
  notificationService: { create: vi.fn() },
}));

import { getCurrentUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { notificationService } from "@/lib/services/notification.service";

describe("Feedback Identified API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("받은 피드백을 조회한다", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-1", email: "a@b.com", name: "테스트", role: "MEMBER" as const,
      });
      vi.mocked(prisma.identifiedFeedback.findMany).mockResolvedValue([
        { id: "f1", content: "좋아요" },
      ] as any);

      const { GET } = await import("@/app/api/feedback/identified/route");
      const req = createNextRequest("/api/feedback/identified");
      const res = await GET(req, { params: {} } as any);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(1);
    });
  });

  describe("POST", () => {
    it("피드백을 생성하고 알림을 보낸다", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-1", email: "a@b.com", name: "작성자", role: "MEMBER" as const,
      });
      vi.mocked(prisma.identifiedFeedback.create).mockResolvedValue({
        id: "f1", authorId: "user-1", targetId: "user-2",
      } as any);

      const { POST } = await import("@/app/api/feedback/identified/route");
      const req = createNextRequest("/api/feedback/identified", {
        method: "POST",
        body: { targetId: "user-2", content: "좋은 성과입니다", category: "STRENGTH" },
      });

      const res = await POST(req, { params: {} } as any);
      expect(res.status).toBe(201);
      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-2",
          type: "FEEDBACK_RECEIVED",
        })
      );
    });
  });
});
