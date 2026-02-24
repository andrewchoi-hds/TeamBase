import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";
import { reviewService } from "@/lib/services/review.service";
import { aggregateReviewData } from "@/lib/utils/review-aggregation";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(
  _req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const isViewingSelf = user.id === params.memberId;
  const isAdmin = user.role === "ADMIN";
  const isManager = user.role === "MANAGER";

  // MEMBER가 타인 결과 접근 불가
  if (!isViewingSelf && !isAdmin && !isManager) {
    return forbidden();
  }

  // MANAGER: 부하 직원만 타인 결과 조회 가능
  if (isManager && !isViewingSelf) {
    const target = await prisma.user.findUnique({
      where: { id: params.memberId },
      select: { managerId: true },
    });
    if (target?.managerId !== user.id) return forbidden();
  }

  const reviews = await reviewService.getReviewResults(params.id, params.memberId);

  // 템플릿 카테고리 가중치 조회
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: params.id },
    select: {
      template: {
        select: {
          categories: { select: { id: true, weight: true } },
        },
      },
    },
  });
  const categoryWeights = cycle?.template?.categories?.map((c) => ({
    categoryId: c.id,
    weight: c.weight,
  }));

  const report = aggregateReviewData(reviews as any, categoryWeights);

  if (reviews.length > 0) {
    report.targetName = (reviews[0] as any).target?.name ?? "";
  }

  // 개별 리뷰 열람 권한 판단
  // ADMIN: 항상 열람 가능
  // MANAGER: 자기 결과 + 부하 결과 열람 가능
  // MEMBER: 자기 결과의 집계만 (개별 불가)
  const canViewIndividualReviews = isAdmin || isManager || false;

  return NextResponse.json({ ...report, canViewIndividualReviews });
}

export const GET = withErrorHandler(handleGET);
