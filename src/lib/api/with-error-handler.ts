import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InternalHandler = (req: NextRequest, context: any) => Promise<NextResponse>;

export function withErrorHandler(handler: InternalHandler): InternalHandler {
  return async (req, context) => {
    try {
      // Next.js 15: params는 항상 Promise이므로 resolve 후 핸들러에 전달
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
