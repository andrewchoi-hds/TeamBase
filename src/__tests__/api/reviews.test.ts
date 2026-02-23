import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNextRequest } from "@/__tests__/helpers/api-test-utils";

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: vi.fn(),
  unauthorized: () => {
    const { NextResponse } = require("next/server");
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  },
  forbidden: () => {
    const { NextResponse } = require("next/server");
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  },
  badRequest: (msg: string) => {
    const { NextResponse } = require("next/server");
    return NextResponse.json({ error: msg }, { status: 400 });
  },
}));

const mockTx = {
  review: { create: vi.fn() },
  reviewResponse: { createMany: vi.fn() },
  reviewAssignment: { update: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  default: {
    review: { findMany: vi.fn(), create: vi.fn() },
    reviewResponse: { createMany: vi.fn() },
    reviewAssignment: { update: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn((cb: any) => cb(mockTx)),
  },
}));

import { getCurrentUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

describe("Reviews API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/reviews", () => {
    it("내가 작성한 평가를 조회한다", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-1", email: "a@b.com", name: "테스트", role: "MEMBER" as const,
      });
      vi.mocked(prisma.review.findMany).mockResolvedValue([{ id: "r1" }] as any);

      const { GET } = await import("@/app/api/reviews/route");
      const req = createNextRequest("/api/reviews");

      const res = await GET(req, { params: {} } as any);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(1);
    });
  });

  describe("POST /api/reviews", () => {
    it("필수 필드 누락 시 400을 반환한다", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-1", email: "a@b.com", name: "테스트", role: "MEMBER" as const,
      });

      const { POST } = await import("@/app/api/reviews/route");
      const req = createNextRequest("/api/reviews", {
        method: "POST",
        body: { responses: [] },
      });

      const res = await POST(req, { params: {} } as any);
      expect(res.status).toBe(400);
    });

    it("평가를 생성하고 응답을 일괄 생성한다", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-1", email: "a@b.com", name: "테스트", role: "MEMBER" as const,
      });
      vi.mocked(prisma.reviewAssignment.findUnique).mockResolvedValue({
        reviewerId: "user-1", status: "PENDING",
      } as any);
      mockTx.review.create.mockResolvedValue({ id: "review-1" } as any);
      mockTx.reviewResponse.createMany.mockResolvedValue({ count: 2 });
      mockTx.reviewAssignment.update.mockResolvedValue({} as any);

      const { POST } = await import("@/app/api/reviews/route");
      const req = createNextRequest("/api/reviews", {
        method: "POST",
        body: {
          assignmentId: "a1",
          cycleId: "c1",
          targetId: "t1",
          responses: [
            { criterionId: "cr1", rating: 4 },
            { criterionId: "cr2", rating: 5, comment: "좋아요" },
          ],
        },
      });

      const res = await POST(req, { params: {} } as any);
      expect(res.status).toBe(201);
      expect(mockTx.reviewResponse.createMany).toHaveBeenCalled();
    });
  });
});
