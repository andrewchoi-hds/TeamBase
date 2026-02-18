import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes - ADMIN only
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // Team management routes - ADMIN or MANAGER
    if (pathname.startsWith("/team") || pathname === "/reviews/new") {
      if (token?.role !== "ADMIN" && token?.role !== "MANAGER") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/reviews/:path*",
    "/feedback/:path*",
    "/objectives/:path*",
    "/meetings/:path*",
    "/team/:path*",
    "/notifications/:path*",
    "/admin/:path*",
  ],
};
