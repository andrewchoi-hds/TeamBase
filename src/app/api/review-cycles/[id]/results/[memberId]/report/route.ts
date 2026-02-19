import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { reviewService } from "@/lib/services/review.service";
import { aggregateReviewData } from "@/lib/utils/review-aggregation";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(
  _req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const reviews = await reviewService.getReviewResults(params.id, params.memberId);
  const report = aggregateReviewData(reviews as any);

  // 대상자 이름 설정
  if (reviews.length > 0) {
    report.targetName = (reviews[0] as any).target?.name ?? "";
  }

  return NextResponse.json(report);
}

export const GET = withErrorHandler(handleGET);
