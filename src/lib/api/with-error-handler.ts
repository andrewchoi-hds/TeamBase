import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (req: NextRequest, context: any) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      // Next.js 14.2+: params가 Promise일 수 있으므로 미리 resolve
      if (context?.params && typeof context.params.then === "function") {
        context = { ...context, params: await context.params };
      }
      return await handler(req, context);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const url = req.nextUrl.pathname;
      const method = req.method;

      logger.error("API 에러 발생", {
        method,
        url,
        error: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });

      // Sentry 전송 (설치된 경우)
      try {
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureException(err, {
          extra: { method, url },
        });
      } catch {
        // Sentry 미설치 시 무시
      }

      return NextResponse.json(
        {
          error: "서버 내부 오류가 발생했습니다.",
          ...(process.env.NODE_ENV === "development" && { detail: err.message }),
        },
        { status: 500 }
      );
    }
  };
}
