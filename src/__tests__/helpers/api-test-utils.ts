import { NextRequest } from "next/server";

export function createNextRequest(
  url: string,
  options?: {
    method?: string;
    body?: unknown;
    searchParams?: Record<string, string>;
  }
): NextRequest {
  const baseUrl = "http://localhost:3000";
  const fullUrl = new URL(url, baseUrl);

  if (options?.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      fullUrl.searchParams.set(key, value);
    });
  }

  const init: RequestInit = {
    method: options?.method || "GET",
    headers: { "Content-Type": "application/json" },
  };

  if (options?.body) {
    init.body = JSON.stringify(options.body);
  }

  return new NextRequest(fullUrl, init as any);
}

export async function parseJsonResponse(response: Response) {
  return response.json();
}
