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
    objective: { findMany: vi.fn(), create: vi.fn() },
  },
}));

import { getCurrentUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

describe("Objectives API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/objectives", () => {
    it("MEMBER는 자신의 목표만 조회한다", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "member-1", email: "a@b.com", name: "멤버", role: "MEMBER" as const,
      });
      vi.mocked(prisma.objective.findMany).mockResolvedValue([{ id: "obj-1", title: "목표 1" }] as any);

      const { GET } = await import("@/app/api/objectives/route");
      const req = createNextRequest("/api/objectives");

      const res = await GET(req, { params: {} } as any);
      expect(res.status).toBe(200);
      expect(prisma.objective.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: "member-1" }),
        })
      );
    });
  });

  describe("POST /api/objectives", () => {
    it("새로운 목표를 생성한다", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user-1", email: "a@b.com", name: "유저", role: "MEMBER" as const,
      });
      vi.mocked(prisma.objective.create).mockResolvedValue({
        id: "obj-1", title: "새 목표", keyResults: [],
      } as any);

      const { POST } = await import("@/app/api/objectives/route");
      const req = createNextRequest("/api/objectives", {
        method: "POST",
        body: {
          title: "새 목표",
          startDate: "2024-01-01",
          endDate: "2024-03-31",
        },
      });

      const res = await POST(req, { params: {} } as any);
      expect(res.status).toBe(201);
    });
  });
});
