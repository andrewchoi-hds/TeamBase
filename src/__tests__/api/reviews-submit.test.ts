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
    review: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/services/review.service", () => ({
  reviewService: {
    submitReview: vi.fn(),
  },
}));

import { getCurrentUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { reviewService } from "@/lib/services/review.service";

describe("Reviews Submit API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증되지 않으면 401을 반환한다", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const { POST } = await import("@/app/api/reviews/[id]/submit/route");
    const req = createNextRequest("/api/reviews/r1/submit", { method: "POST" });

    const res = await POST(req, { params: { id: "r1" } });
    expect(res.status).toBe(401);
  });

  it("평가를 제출한다", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1", email: "a@b.com", name: "테스트", role: "MEMBER" as const,
    });
    vi.mocked(prisma.review.findUnique).mockResolvedValue({
      authorId: "user-1",
    } as any);
    vi.mocked(reviewService.submitReview).mockResolvedValue({ id: "r1", status: "SUBMITTED" } as any);

    const { POST } = await import("@/app/api/reviews/[id]/submit/route");
    const req = createNextRequest("/api/reviews/r1/submit", { method: "POST" });

    const res = await POST(req, { params: { id: "r1" } });
    expect(res.status).toBe(200);
    expect(reviewService.submitReview).toHaveBeenCalledWith("r1");
  });

  it("본인이 작성하지 않은 평가 제출 시 403을 반환한다", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1", email: "a@b.com", name: "테스트", role: "MEMBER" as const,
    });
    vi.mocked(prisma.review.findUnique).mockResolvedValue({
      authorId: "other-user",
    } as any);

    const { POST } = await import("@/app/api/reviews/[id]/submit/route");
    const req = createNextRequest("/api/reviews/r1/submit", { method: "POST" });

    const res = await POST(req, { params: { id: "r1" } });
    expect(res.status).toBe(403);
  });
});
