import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";
import { anonymousFeedbackService } from "@/lib/services/anonymous-feedback.service";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return forbidden();

  const { targetId, count = 5, expiresInDays = 30 } = await req.json();

  if (!targetId) {
    return NextResponse.json({ error: "대상자 ID가 필요합니다." }, { status: 400 });
  }

  const tokens = await anonymousFeedbackService.createTokens(targetId, count, expiresInDays);
  const urls = tokens.map((token) => `${process.env.NEXTAUTH_URL}/feedback/anonymous/${token}`);

  return NextResponse.json({ tokens, urls, count }, { status: 201 });
}
