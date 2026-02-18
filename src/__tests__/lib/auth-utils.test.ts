import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { getServerSession } from "next-auth";
import { getCurrentUser, requireAuth, requireRole, unauthorized, forbidden, notFound, badRequest } from "@/lib/auth-utils";

describe("auth-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurrentUser", () => {
    it("세션이 있으면 user를 반환한다", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "1", email: "a@b.com", name: "테스트", role: "MEMBER" },
      });

      const user = await getCurrentUser();
      expect(user).toEqual({ id: "1", email: "a@b.com", name: "테스트", role: "MEMBER" });
    });

    it("세션이 없으면 null을 반환한다", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe("requireAuth", () => {
    it("인증되지 않으면 에러를 던진다", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      await expect(requireAuth()).rejects.toThrow("인증이 필요합니다.");
    });

    it("인증되면 user를 반환한다", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "1", email: "a@b.com", name: "테스트", role: "MEMBER" },
      });

      const user = await requireAuth();
      expect(user.id).toBe("1");
    });
  });

  describe("requireRole", () => {
    it("권한이 없으면 에러를 던진다", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "1", email: "a@b.com", name: "멤버", role: "MEMBER" },
      });

      await expect(requireRole("ADMIN" as any)).rejects.toThrow("권한이 없습니다.");
    });

    it("권한이 있으면 user를 반환한다", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "1", email: "a@b.com", name: "관리자", role: "ADMIN" },
      });

      const user = await requireRole("ADMIN" as any);
      expect(user.role).toBe("ADMIN");
    });
  });

  describe("응답 헬퍼", () => {
    it("unauthorized는 401 응답", async () => {
      const res = unauthorized();
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain("인증");
    });

    it("forbidden은 403 응답", async () => {
      const res = forbidden();
      expect(res.status).toBe(403);
    });

    it("notFound는 404 응답", async () => {
      const res = notFound("없음");
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("없음");
    });

    it("badRequest는 400 응답", async () => {
      const res = badRequest("잘못됨");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("잘못됨");
    });
  });
});
