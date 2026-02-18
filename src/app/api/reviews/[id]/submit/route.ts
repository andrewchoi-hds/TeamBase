import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { reviewService } from "@/lib/services/review.service";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const review = await reviewService.submitReview(params.id);
    return NextResponse.json(review);
  } catch {
    return NextResponse.json({ error: "제출에 실패했습니다." }, { status: 500 });
  }
}
