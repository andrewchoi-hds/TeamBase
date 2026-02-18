import { describe, it, expect, vi, beforeEach } from "vitest";

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
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findMany: vi.fn() },
    reviewAssignment: { count: vi.fn() },
    identifiedFeedback: { count: vi.fn() },
  },
}));

import { getCurrentUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

describe("Dashboard Team API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("MEMBER는 접근할 수 없다 (403)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1", email: "a@b.com", name: "멤버", role: "MEMBER" as const,
    });
    const { GET } = await import("@/app/api/dashboard/team/route");

    const res = await GET(new Request("http://localhost/api/dashboard/team") as any, { params: {} } as any);
    expect(res.status).toBe(403);
  });

  it("ADMIN은 전체 멤버의 팀 대시보드를 조회한다", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "admin-1", email: "admin@b.com", name: "관리자", role: "ADMIN" as const,
    });
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "u1" }, { id: "u2" },
    ] as any);
    vi.mocked(prisma.reviewAssignment.count)
      .mockResolvedValueOnce(3)  // pending
      .mockResolvedValueOnce(7); // completed
    vi.mocked(prisma.identifiedFeedback.count).mockResolvedValue(5);

    const { GET } = await import("@/app/api/dashboard/team/route");
    const res = await GET(new Request("http://localhost/api/dashboard/team") as any, { params: {} } as any);
    const body = await res.json();

    expect(body.totalMembers).toBe(2);
    expect(body.completionRate).toBe(70); // 7/(3+7)*100
  });
});
