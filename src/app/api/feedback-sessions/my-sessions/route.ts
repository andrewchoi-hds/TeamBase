import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  // 모든 ACTIVE 세션 조회 (모든 사용자가 피드백 참여 가능)
  const sessions = await prisma.feedbackSession.findMany({
    where: { status: "ACTIVE" },
    include: {
      targets: {
        include: {
          user: { select: { id: true, name: true, position: true } },
          _count: { select: { responses: true } },
          responses: { where: { authorId: user.id }, select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = sessions.map((session) => {
    // 나 자신을 제외한 대상자 목록
    const myTargets = session.targets.filter((t) => t.userId !== user.id);

    return {
      id: session.id,
      name: session.name,
      mode: session.mode,
      status: session.status,
      endDate: session.endDate,
      totalTargets: myTargets.length,
      writtenCount: myTargets.filter((t) => t.responses.length > 0).length,
      targets: myTargets.map((t) => ({
        id: t.id,
        userId: t.userId,
        userName: t.user.name,
        userPosition: t.user.position,
        hasWritten: t.responses.length > 0,
      })),
    };
  });

  // 대상자가 있는 세션만 반환
  return NextResponse.json(result.filter((s) => s.totalTargets > 0));
}

export const GET = withErrorHandler(handleGET);
