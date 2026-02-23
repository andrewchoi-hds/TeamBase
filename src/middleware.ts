import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  return response;
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // API Rate Limiting
    if (pathname.startsWith("/api/")) {
      const ip = getClientIp(req);
      const userId = token?.id as string || ip;

      // 인증 관련 엔드포인트는 더 엄격한 제한
      let preset: "auth" | "register" | "api" | "feedback" = "api";
      if (pathname.startsWith("/api/auth/register")) preset = "register";

      const result = rateLimit(`${preset}:${userId}`, preset);
      if (!result.success) {
        return rateLimitResponse(result.resetAt);
      }
    }

    // Admin routes - ADMIN only
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    const response = NextResponse.next();
    return addSecurityHeaders(response);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // 인증 API는 토큰 없이 접근 가능
        if (pathname.startsWith("/api/auth/")) return true;
        // Cron 엔드포인트 (CRON_SECRET으로 자체 인증)
        if (pathname.startsWith("/api/cron/")) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/reviews/:path*",
    "/feedback/:path*",
    "/notifications/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};
