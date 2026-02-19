import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";
import { anonymousFeedbackService } from "@/lib/services/anonymous-feedback.service";
import { accessLogService } from "@/lib/services/access-log.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(_req: NextRequest, { params }: { params: { targetId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  // 본인 피드백 또는 ADMIN/MANAGER만 조회 가능
  if (params.targetId !== user.id && user.role !== "ADMIN" && user.role !== "MANAGER") {
    return forbidden();
  }

  const result = await anonymousFeedbackService.getByTarget(params.targetId);

  await accessLogService.log({
    viewerId: user.id,
    targetId: params.targetId,
    resourceType: "FEEDBACK",
  });

  return NextResponse.json(result);
}

export const GET = withErrorHandler(handleGET);
