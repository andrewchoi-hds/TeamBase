import { NextRequest, NextResponse } from "next/server";
import { anonymousFeedbackService } from "@/lib/services/anonymous-feedback.service";
import { notificationService } from "@/lib/services/notification.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handlePOST(req: NextRequest) {
  const { token, content, category } = await req.json();

  if (!token || !content) {
    return NextResponse.json({ error: "토큰과 내용이 필요합니다." }, { status: 400 });
  }

  const feedback = await anonymousFeedbackService.submit(token, content, category);

  await notificationService.create({
    userId: feedback.targetId,
    type: "FEEDBACK_RECEIVED",
    title: "새로운 익명 피드백",
    message: "새로운 익명 피드백이 도착했습니다.",
    link: "/feedback",
  });

  return NextResponse.json({ message: "피드백이 제출되었습니다." }, { status: 201 });
}

export const POST = withErrorHandler(handlePOST);
