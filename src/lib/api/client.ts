import type { ApiResponse } from "@/types";

const BASE_URL = "/api";
const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY = 500;

async function requestWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${BASE_URL}${endpoint}`;

  const isGet = !options?.method || options.method === "GET";
  const maxAttempts = isGet ? MAX_RETRIES + 1 : 1;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        const delay = RETRY_BASE_DELAY * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }

      const res = await requestWithTimeout(url, options);

      if (!res.ok) {
        const error: ApiResponse = await res.json().catch(() => ({
          error: "요청 처리 중 오류가 발생했습니다.",
        }));
        throw new Error(error.error || `HTTP ${res.status}`);
      }

      return res.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (lastError.name === "AbortError") {
        lastError = new Error("요청 시간이 초과되었습니다.");
      }

      // 재시도 불가능한 에러 (GET이 아니거나 마지막 시도)
      if (!isGet || attempt === maxAttempts - 1) {
        throw lastError;
      }
    }
  }

  throw lastError!;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
};
