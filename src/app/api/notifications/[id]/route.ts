import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { notificationService } from "@/lib/services/notification.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handlePATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  if (params.id === "read-all") {
    await notificationService.markAllAsRead(user.id);
    return NextResponse.json({ message: "모두 읽음 처리되었습니다." });
  }

  await notificationService.markAsRead(params.id, user.id);
  return NextResponse.json({ message: "읽음 처리되었습니다." });
}

export const PATCH = withErrorHandler(handlePATCH);
