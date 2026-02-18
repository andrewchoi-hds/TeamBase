import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { reviewService } from "@/lib/services/review.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handlePOST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const review = await reviewService.submitReview(params.id);
  return NextResponse.json(review);
}

export const POST = withErrorHandler(handlePOST);
