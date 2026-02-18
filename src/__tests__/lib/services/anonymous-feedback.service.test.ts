import { describe, it, expect, vi, beforeEach } from "vitest";
import { anonymousFeedbackService } from "@/lib/services/anonymous-feedback.service";

vi.mock("@/lib/prisma", () => ({
  default: {
    anonymousFeedbackToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    anonymousFeedback: {
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";

describe("AnonymousFeedbackService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTokens", () => {
    it("지정된 개수만큼 토큰을 생성한다", async () => {
      vi.mocked(prisma.anonymousFeedbackToken.create).mockResolvedValue({ id: "token-1" } as any);

      const tokens = await anonymousFeedbackService.createTokens("target-1", 3);
      expect(tokens).toHaveLength(3);
      expect(prisma.anonymousFeedbackToken.create).toHaveBeenCalledTimes(3);
    });

    it("토큰은 64자리 hex 문자열이다", async () => {
      vi.mocked(prisma.anonymousFeedbackToken.create).mockResolvedValue({ id: "token-1" } as any);

      const tokens = await anonymousFeedbackService.createTokens("target-1", 1);
      expect(tokens[0]).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("validateToken", () => {
    it("유효한 토큰을 검증한다", async () => {
      vi.mocked(prisma.anonymousFeedbackToken.findUnique).mockResolvedValue({
        id: "token-1",
        targetId: "target-1",
        isUsed: false,
        expiresAt: new Date(Date.now() + 86400000),
      } as any);

      const result = await anonymousFeedbackService.validateToken("a".repeat(64));
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.targetId).toBe("target-1");
      }
    });

    it("존재하지 않는 토큰은 invalid", async () => {
      vi.mocked(prisma.anonymousFeedbackToken.findUnique).mockResolvedValue(null);

      const result = await anonymousFeedbackService.validateToken("invalid");
      expect(result.valid).toBe(false);
    });

    it("사용된 토큰은 invalid", async () => {
      vi.mocked(prisma.anonymousFeedbackToken.findUnique).mockResolvedValue({
        id: "token-1",
        isUsed: true,
        expiresAt: new Date(Date.now() + 86400000),
      } as any);

      const result = await anonymousFeedbackService.validateToken("used-token");
      expect(result.valid).toBe(false);
    });

    it("만료된 토큰은 invalid", async () => {
      vi.mocked(prisma.anonymousFeedbackToken.findUnique).mockResolvedValue({
        id: "token-1",
        isUsed: false,
        expiresAt: new Date(Date.now() - 86400000),
      } as any);

      const result = await anonymousFeedbackService.validateToken("expired");
      expect(result.valid).toBe(false);
    });
  });

  describe("getByTarget", () => {
    it("k-anonymity: 피드백이 3개 미만이면 비공개", async () => {
      vi.mocked(prisma.anonymousFeedback.count).mockResolvedValue(2);

      const result = await anonymousFeedbackService.getByTarget("target-1");
      expect(result.isVisible).toBe(false);
      expect(result.feedbacks).toEqual([]);
    });

    it("k-anonymity: 피드백이 3개 이상이면 공개", async () => {
      vi.mocked(prisma.anonymousFeedback.count).mockResolvedValue(3);
      vi.mocked(prisma.anonymousFeedback.findMany).mockResolvedValue([
        { id: "1", category: "GENERAL", content: "좋아요", createdAt: new Date() },
        { id: "2", category: "STRENGTH", content: "잘해요", createdAt: new Date() },
        { id: "3", category: "IMPROVEMENT", content: "개선점", createdAt: new Date() },
      ] as any);

      const result = await anonymousFeedbackService.getByTarget("target-1");
      expect(result.isVisible).toBe(true);
      expect(result.feedbacks).toHaveLength(3);
    });
  });
});
