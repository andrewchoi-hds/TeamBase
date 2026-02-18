import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "@/lib/api/client";

describe("API Client", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("GET 요청을 보낸다", async () => {
    const mockData = { id: "1", name: "test" };
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify(mockData), { status: 200 })
    );

    const result = await api.get("/users");
    expect(result).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/users"),
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
  });

  it("POST 요청에 body를 포함한다", async () => {
    const mockResponse = { id: "1" };
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 201 })
    );

    const result = await api.post("/users", { name: "test" });
    expect(result).toEqual(mockResponse);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/users"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "test" }),
      })
    );
  });

  it("PATCH 요청을 보낸다", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ updated: true }), { status: 200 })
    );

    await api.patch("/users/1", { name: "updated" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("DELETE 요청을 보낸다", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ deleted: true }), { status: 200 })
    );

    await api.delete("/users/1");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("HTTP 에러 시 예외를 던진다", async () => {
    // GET은 재시도하므로 모든 시도에서 에러 응답을 반환
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "인증 필요" }), { status: 401 })
    );

    await expect(api.post("/protected", {})).rejects.toThrow("인증 필요");
  });

  it("GET 요청 실패 시 재시도한다", async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch
      .mockRejectedValueOnce(new Error("network error"))
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );

    const result = await api.get("/retry-test");
    expect(result).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("POST 요청은 재시도하지 않는다", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error("network error"));

    await expect(api.post("/no-retry")).rejects.toThrow("network error");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
