import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { reviewService } from "@/lib/services/review.service";

async function handlePOST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { strategies, targetUserIds } = await req.json();

  if (!strategies || !Array.isArray(strategies) || strategies.length === 0) {
    return NextResponse.json({ error: "배정 전략을 선택해주세요." }, { status: 400 });
  }

  const result = await reviewService.previewAssignments(strategies, targetUserIds);

  return NextResponse.json(result);
}

export const POST = withErrorHandler(handlePOST);
