import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { anonymousFeedbackService } from "@/lib/services/anonymous-feedback.service";
import { accessLogService } from "@/lib/services/access-log.service";

export async function GET(_req: NextRequest, { params }: { params: { targetId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const result = await anonymousFeedbackService.getByTarget(params.targetId);

  // Log access
  await accessLogService.log({
    viewerId: user.id,
    targetId: params.targetId,
    resourceType: "FEEDBACK",
  });

  return NextResponse.json(result);
}
