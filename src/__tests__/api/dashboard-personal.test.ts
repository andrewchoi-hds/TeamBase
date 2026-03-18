import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUser: vi.fn(),
  unauthorized: () => {
    const { NextResponse } = require("next/server");
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    reviewAssignment: { count: vi.fn() },
    feedbackSessionResponse: { count: vi.fn() },
    developmentGoal: { findMany: vi.fn() },
    reviewCycle: { findMany: vi.fn() },
  },
}));

import { getCurrentUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

describe("Dashboard Personal API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증되지 않으면 401을 반환한다", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const { GET } = await import("@/app/api/dashboard/personal/route");

    const res = await GET(new Request("http://localhost/api/dashboard/personal") as any, { params: {} } as any);
    expect(res.status).toBe(401);
  });

  it("대시보드 데이터를 반환한다", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1", email: "a@b.com", name: "테스트", role: "MEMBER" as const,
    });
    vi.mocked(prisma.reviewAssignment.count)
      .mockResolvedValueOnce(2)  // pending
      .mockResolvedValueOnce(5); // completed
    vi.mocked(prisma.feedbackSessionResponse.count).mockResolvedValue(3);
    vi.mocked(prisma.developmentGoal.findMany).mockResolvedValue([
      { progress: 50 },
      { progress: 80 },
    ] as any);
    vi.mocked(prisma.reviewCycle.findMany).mockResolvedValue([
      {
        id: "cycle-1",
        name: "2026 상반기 평가",
        status: "COMPLETED",
        endDate: new Date("2026-06-30"),
        assignments: [
          { reviewType: "PEER", review: { overallRating: 4.2 } },
          { reviewType: "DOWNWARD", review: { overallRating: 3.8 } },
        ],
      },
    ] as any);

    const { GET } = await import("@/app/api/dashboard/personal/route");
    const res = await GET(new Request("http://localhost/api/dashboard/personal") as any, { params: {} } as any);
    const body = await res.json();

    expect(body.pendingAssignments).toBe(2);
    expect(body.completedAssignments).toBe(5);
    expect(body.feedbackReceived).toBe(3);
    expect(body.avgOkrProgress).toBe(65);
    expect(body.myResults).toHaveLength(1);
    expect(body.myResults[0].cycleName).toBe("2026 상반기 평가");
    expect(body.myResults[0].avgScore).toBe(4);
    expect(body.myResults[0].typeScores).toEqual({ PEER: 4.2, DOWNWARD: 3.8 });
  });
});
