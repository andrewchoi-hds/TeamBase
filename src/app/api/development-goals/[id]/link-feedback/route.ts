import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden, notFound, badRequest } from "@/lib/auth-utils";
import { developmentGoalService } from "@/lib/services/development-goal.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handlePOST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const goal = await developmentGoalService.getById(params.id);
  if (!goal) return notFound("개선 목표를 찾을 수 없습니다.");

  if (goal.ownerId !== user.id && user.role !== "ADMIN") return forbidden();

  const data = await req.json();
  if (!data.identifiedFeedbackId && !data.anonymousFeedbackId) {
    return badRequest("연결할 피드백 ID를 지정해주세요.");
  }

  const link = await developmentGoalService.linkFeedback(params.id, {
    identifiedFeedbackId: data.identifiedFeedbackId,
    anonymousFeedbackId: data.anonymousFeedbackId,
  });

  return NextResponse.json(link, { status: 201 });
}

export const POST = withErrorHandler(handlePOST);
