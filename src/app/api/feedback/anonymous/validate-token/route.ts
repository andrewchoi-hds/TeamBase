import { NextRequest, NextResponse } from "next/server";
import { anonymousFeedbackService } from "@/lib/services/anonymous-feedback.service";
import prisma from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handlePOST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "토큰이 필요합니다." }, { status: 400 });
  }

  const result = await anonymousFeedbackService.validateToken(token);

  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: result.targetId },
    select: { name: true },
  });

  return NextResponse.json({ valid: true, targetName: target?.name });
}

export const POST = withErrorHandler(handlePOST);
