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
  notFound: (msg: string) => {
    const { NextResponse } = require("next/server");
    return NextResponse.json({ error: msg }, { status: 404 });
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    review: { findUnique: vi.fn(), update: vi.fn() },
    reviewResponse: { findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
  },
}));

import { getCurrentUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

describe("Reviews [id] API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/reviews/[id]", () => {
    it("평가가 없으면 404를 반환한다", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-1", email: "a@b.com", name: "테스트", role: "MEMBER" as const,
      });
      vi.mocked(prisma.review.findUnique).mockResolvedValue(null);

      const { GET } = await import("@/app/api/reviews/[id]/route");
      const req = createNextRequest("/api/reviews/nonexistent");
      const res = await GET(req, { params: { id: "nonexistent" } });

      expect(res.status).toBe(404);
    });

    it("평가 상세를 반환한다", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-1", email: "a@b.com", name: "테스트", role: "MEMBER" as const,
      });
      vi.mocked(prisma.review.findUnique).mockResolvedValue({
        id: "review-1",
        authorId: "user-1",
        responses: [],
      } as any);

      const { GET } = await import("@/app/api/reviews/[id]/route");
      const req = createNextRequest("/api/reviews/review-1");
      const res = await GET(req, { params: { id: "review-1" } });

      expect(res.status).toBe(200);
    });
  });

  describe("PATCH /api/reviews/[id]", () => {
    it("작성자만 수정할 수 있다", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-2", email: "a@b.com", name: "다른사람", role: "MEMBER" as const,
      });
      vi.mocked(prisma.review.findUnique).mockResolvedValue({
        id: "review-1",
        authorId: "user-1",
      } as any);

      const { PATCH } = await import("@/app/api/reviews/[id]/route");
      const req = createNextRequest("/api/reviews/review-1", {
        method: "PATCH",
        body: { overallRating: 4 },
      });

      const res = await PATCH(req, { params: { id: "review-1" } });
      expect(res.status).toBe(403);
    });
  });
});
