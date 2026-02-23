import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound, badRequest } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const session = await prisma.feedbackSession.findUnique({
    where: { id: params.id },
    select: { id: true, mode: true, status: true, minResponsesForVisibility: true },
  });
  if (!session) return notFound("세션을 찾을 수 없습니다.");

  // 대상자별로 자신에게 온 피드백만 조회 (ADMIN은 전체)
  const targets = await prisma.feedbackSessionTarget.findMany({
    where: {
      sessionId: params.id,
      ...(user.role !== "ADMIN" ? { userId: user.id } : {}),
    },
    include: {
      user: { select: { id: true, name: true } },
      responses: {
        include: {
          author: session.mode === "NAMED" ? { select: { id: true, name: true } } : false,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // 익명 모드: 최소 응답 수 미달 시 내용 숨김
  const result = targets.map((target) => {
    const meetsThreshold = target.responses.length >= session.minResponsesForVisibility;
    return {
      ...target,
      isVisible: meetsThreshold,
      responses: meetsThreshold
        ? target.responses
        : [],
      responseCount: target.responses.length,
    };
  });

  return NextResponse.json(result);
}

async function handlePOST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const session = await prisma.feedbackSession.findUnique({
    where: { id: params.id },
    select: { id: true, mode: true, status: true },
  });
  if (!session) return notFound("세션을 찾을 수 없습니다.");
  if (session.status !== "ACTIVE") return badRequest("활성 상태의 세션에만 피드백을 작성할 수 있습니다.");

  const { targetId, category, content } = await req.json();

  if (!targetId || !content?.trim()) {
    return badRequest("대상자와 내용을 입력하세요.");
  }

  // targetId는 FeedbackSessionTarget의 ID
  const target = await prisma.feedbackSessionTarget.findUnique({
    where: { id: targetId },
    include: { participants: true },
  });
  if (!target || target.sessionId !== params.id) return notFound("대상자를 찾을 수 없습니다.");

  // 자기 자신에게 쓸 수 없음
  if (target.userId === user.id) return badRequest("자기 자신에게 피드백을 작성할 수 없습니다.");

  // 참여자 체크: 참여자 목록이 있으면 해당 목록에 포함되어야 함
  if (target.participants.length > 0) {
    const isParticipant = target.participants.some((p) => p.userId === user.id);
    if (!isParticipant) return forbidden();
  }

  const response = await prisma.feedbackSessionResponse.create({
    data: {
      targetId,
      authorId: session.mode === "NAMED" ? user.id : null,
      category: category || "GENERAL",
      content: content.trim(),
    },
  });

  return NextResponse.json(response, { status: 201 });
}

export const GET = withErrorHandler(handleGET);
export const POST = withErrorHandler(handlePOST);
