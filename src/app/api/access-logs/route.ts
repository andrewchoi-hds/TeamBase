import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, badRequest } from "@/lib/auth-utils";
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

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { targetId, resourceType, resourceId } = await req.json();
  if (!targetId || !resourceType) return badRequest("targetId와 resourceType은 필수입니다.");

  const log = await accessLogService.log({
    viewerId: user.id,
    targetId,
    resourceType,
    resourceId,
  });

  return NextResponse.json(log ?? { skipped: true }, { status: 201 });
}
