import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden, notFound, badRequest } from "@/lib/auth-utils";
import { developmentGoalService } from "@/lib/services/development-goal.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import prisma from "@/lib/prisma";

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

  // 피드백 존재 여부 검증
  if (data.identifiedFeedbackId) {
    const fb = await prisma.identifiedFeedback.findUnique({ where: { id: data.identifiedFeedbackId }, select: { id: true } });
    if (!fb) return notFound("기명 피드백을 찾을 수 없습니다.");
  }
  if (data.anonymousFeedbackId) {
    const fb = await prisma.anonymousFeedback.findUnique({ where: { id: data.anonymousFeedbackId }, select: { id: true } });
    if (!fb) return notFound("무기명 피드백을 찾을 수 없습니다.");
  }

  const link = await developmentGoalService.linkFeedback(params.id, {
    identifiedFeedbackId: data.identifiedFeedbackId,
    anonymousFeedbackId: data.anonymousFeedbackId,
  }, user.id);

  return NextResponse.json(link, { status: 201 });
}

export const POST = withErrorHandler(handlePOST);
