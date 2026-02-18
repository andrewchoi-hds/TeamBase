import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { accessLogService } from "@/lib/services/access-log.service";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get("type"); // "viewer" | "target"
  const limit = Number(searchParams.get("limit") || 20);
  const offset = Number(searchParams.get("offset") || 0);

  const result = type === "viewer"
    ? await accessLogService.getByViewer(user.id, { limit, offset })
    : await accessLogService.getByTarget(user.id, { limit, offset });

  return NextResponse.json(result);
}
