import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { notificationService } from "@/lib/services/notification.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const searchParams = req.nextUrl.searchParams;
  const isRead = searchParams.get("isRead");
  const limit = Number(searchParams.get("limit") || 20);
  const offset = Number(searchParams.get("offset") || 0);

  const result = await notificationService.getByUserId(user.id, {
    isRead: isRead !== null ? isRead === "true" : undefined,
    limit,
    offset,
  });

  return NextResponse.json(result);
}

export const GET = withErrorHandler(handleGET);
