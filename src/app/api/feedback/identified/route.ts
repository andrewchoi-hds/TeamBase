import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { notificationService } from "@/lib/services/notification.service";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get("type"); // "given" | "received"

  const where = type === "given" ? { authorId: user.id } : { targetId: user.id };

  const feedbacks = await prisma.identifiedFeedback.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, position: true } },
      target: { select: { id: true, name: true, position: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(feedbacks);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const data = await req.json();
  const feedback = await prisma.identifiedFeedback.create({
    data: {
      authorId: user.id,
      targetId: data.targetId,
      category: data.category || "GENERAL",
      content: data.content,
      isPublic: data.isPublic ?? false,
    },
  });

  await notificationService.create({
    userId: data.targetId,
    type: "FEEDBACK_RECEIVED",
    title: "새로운 피드백",
    message: `${user.name}님이 피드백을 남겼습니다.`,
    link: "/feedback",
  });

  return NextResponse.json(feedback, { status: 201 });
}
