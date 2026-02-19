import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { reviewService } from "@/lib/services/review.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handlePOST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  // 평가 작성자만 제출 가능
  const existing = await prisma.review.findUnique({
    where: { id: params.id },
    select: { authorId: true },
  });
  if (!existing) return notFound("평가를 찾을 수 없습니다.");
  if (existing.authorId !== user.id) return forbidden();

  const review = await reviewService.submitReview(params.id);
  return NextResponse.json(review);
}

export const POST = withErrorHandler(handlePOST);
