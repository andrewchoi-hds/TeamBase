import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { reviewService } from "@/lib/services/review.service";
import { generateReviewSummary } from "@/lib/services/ai-summary.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(
  _req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id: cycleId, memberId } = params;

  if (!canAccess(user, memberId)) {
    const target = await prisma.user.findUnique({
      where: { id: memberId },
      select: { managerId: true },
    });
    if (user.role !== "MANAGER" || target?.managerId !== user.id) {
      return forbidden();
    }
  }

  const summary = await prisma.reviewSummary.findUnique({
    where: { cycleId_targetId: { cycleId, targetId: memberId } },
  });

  if (!summary) {
    return NextResponse.json({ summary: null });
  }

  return NextResponse.json({ summary: { ...summary, content: JSON.parse(summary.content) } });
}

async function handlePOST(
  _req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id: cycleId, memberId } = params;

  if (!canAccess(user, memberId)) {
    const target = await prisma.user.findUnique({
      where: { id: memberId },
      select: { managerId: true },
    });
    if (user.role !== "MANAGER" || target?.managerId !== user.id) {
      return forbidden();
    }
  }

  // 기존 캐시 확인
  const existing = await prisma.reviewSummary.findUnique({
    where: { cycleId_targetId: { cycleId, targetId: memberId } },
  });
  if (existing) {
    return NextResponse.json({ summary: { ...existing, content: JSON.parse(existing.content) } });
  }

  // 리뷰 데이터 가져오기
  const reviews = await reviewService.getReviewResults(cycleId, memberId);
  if (reviews.length === 0) {
    return notFound("평가 결과가 없습니다.");
  }

  // AI 요약 생성
  const reviewInputs = reviews.map((r) => ({
    reviewType: r.assignment.reviewType,
    overallRating: r.overallRating,
    overallComment: r.overallComment,
    responses: r.responses.map((resp) => ({
      criterionName: resp.criterion.name,
      rating: resp.rating,
      comment: resp.comment,
      textValue: resp.textValue,
    })),
  }));

  const result = await generateReviewSummary(reviewInputs);
  if (!result) {
    return NextResponse.json(
      { error: "AI 요약을 생성할 수 없습니다. API 키를 확인해주세요." },
      { status: 503 }
    );
  }

  // DB 저장
  const summary = await prisma.reviewSummary.create({
    data: {
      cycleId,
      targetId: memberId,
      content: JSON.stringify(result),
    },
  });

  return NextResponse.json({ summary: { ...summary, content: result } }, { status: 201 });
}

function canAccess(
  user: { id: string; role: string },
  memberId: string
): boolean {
  return user.id === memberId || user.role === "ADMIN";
}

export const GET = withErrorHandler(handleGET);
export const POST = withErrorHandler(handlePOST);
