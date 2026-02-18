import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/with-error-handler";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("withErrorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("정상 응답을 그대로 반환한다", async () => {
    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ ok: true })
    );
    const wrapped = withErrorHandler(handler);
    const req = new NextRequest("http://localhost/api/test");

    const res = await wrapped(req, { params: {} });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("에러 발생 시 500 응답을 반환한다", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("DB 연결 실패"));
    const wrapped = withErrorHandler(handler);
    const req = new NextRequest("http://localhost/api/test");

    const res = await wrapped(req, { params: {} });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("서버 내부 오류가 발생했습니다.");
  });

  it("비 Error 객체도 처리한다", async () => {
    const handler = vi.fn().mockRejectedValue("string error");
    const wrapped = withErrorHandler(handler);
    const req = new NextRequest("http://localhost/api/test");

    const res = await wrapped(req, { params: {} });
    expect(res.status).toBe(500);
  });
});
