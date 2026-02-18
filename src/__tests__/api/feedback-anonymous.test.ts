import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNextRequest } from "@/__tests__/helpers/api-test-utils";

vi.mock("@/lib/services/anonymous-feedback.service", () => ({
  anonymousFeedbackService: {
    submit: vi.fn(),
    validateToken: vi.fn(),
  },
}));

vi.mock("@/lib/services/notification.service", () => ({
  notificationService: { create: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findUnique: vi.fn() },
  },
}));

import { anonymousFeedbackService } from "@/lib/services/anonymous-feedback.service";
import prisma from "@/lib/prisma";

describe("Anonymous Feedback API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/feedback/anonymous/submit", () => {
    it("토큰과 내용이 없으면 400을 반환한다", async () => {
      const { POST } = await import("@/app/api/feedback/anonymous/submit/route");
      const req = createNextRequest("/api/feedback/anonymous/submit", {
        method: "POST",
        body: { token: "", content: "" },
      });

      const res = await POST(req, { params: {} } as any);
      expect(res.status).toBe(400);
    });

    it("유효한 토큰으로 피드백을 제출한다", async () => {
      vi.mocked(anonymousFeedbackService.submit).mockResolvedValue({
        id: "fb-1",
        targetId: "target-1",
      } as any);

      const { POST } = await import("@/app/api/feedback/anonymous/submit/route");
      const req = createNextRequest("/api/feedback/anonymous/submit", {
        method: "POST",
        body: { token: "valid-token", content: "익명 피드백" },
      });

      const res = await POST(req, { params: {} } as any);
      expect(res.status).toBe(201);
    });
  });

  describe("POST /api/feedback/anonymous/validate-token", () => {
    it("유효한 토큰을 검증한다", async () => {
      vi.mocked(anonymousFeedbackService.validateToken).mockResolvedValue({
        valid: true,
        targetId: "target-1",
        tokenId: "tok-1",
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: "대상자" } as any);

      const { POST } = await import("@/app/api/feedback/anonymous/validate-token/route");
      const req = createNextRequest("/api/feedback/anonymous/validate-token", {
        method: "POST",
        body: { token: "test-token" },
      });

      const res = await POST(req, { params: {} } as any);
      const body = await res.json();
      expect(body.valid).toBe(true);
      expect(body.targetName).toBe("대상자");
    });

    it("유효하지 않은 토큰은 400을 반환한다", async () => {
      vi.mocked(anonymousFeedbackService.validateToken).mockResolvedValue({
        valid: false,
        error: "유효하지 않은 토큰입니다.",
      } as any);

      const { POST } = await import("@/app/api/feedback/anonymous/validate-token/route");
      const req = createNextRequest("/api/feedback/anonymous/validate-token", {
        method: "POST",
        body: { token: "invalid" },
      });

      const res = await POST(req, { params: {} } as any);
      expect(res.status).toBe(400);
    });
  });
});
