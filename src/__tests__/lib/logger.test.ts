import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("error 레벨 메시지를 출력한다", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("테스트 에러");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain("테스트 에러");
  });

  it("warn 레벨 메시지를 출력한다", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("테스트 경고");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain("테스트 경고");
  });

  it("info 레벨 메시지를 출력한다", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logger.info("정보 메시지");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain("정보 메시지");
  });

  it("메타데이터를 포함할 수 있다", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("에러 발생", { url: "/api/test", method: "GET" });
    expect(spy).toHaveBeenCalledTimes(1);
    const output = spy.mock.calls[0][0];
    expect(output).toContain("에러 발생");
    expect(output).toContain("/api/test");
  });
});
