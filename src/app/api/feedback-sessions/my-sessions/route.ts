import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  // 내가 참여자로 지정된 ACTIVE 세션 (대상자이거나 피드백 작성자)
  const sessions = await prisma.feedbackSession.findMany({
    where: {
      status: "ACTIVE",
      targets: {
        some: {
          OR: [
            { userId: user.id },
            { participants: { some: { userId: user.id } } },
          ],
        },
      },
    },
    include: {
      targets: {
        include: {
          user: { select: { id: true, name: true } },
          _count: { select: { responses: true } },
          participants: { where: { userId: user.id }, select: { id: true } },
          responses: { where: { authorId: user.id }, select: { id: true, targetId: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 각 세션에서 내가 피드백을 작성해야 할 대상자와 작성 현황 계산
  const result = sessions.map((session) => {
    const myTargets = session.targets.filter(
      (t) => t.userId !== user.id && (t.participants.length === 0 || t.participants.some((p) => p.id))
    );
    const writtenTargetIds = new Set(
      session.targets.flatMap((t) => t.responses.filter((r) => r.targetId === t.id).map(() => t.id))
    );

    return {
      id: session.id,
      name: session.name,
      mode: session.mode,
      status: session.status,
      endDate: session.endDate,
      totalTargets: myTargets.length,
      writtenCount: myTargets.filter((t) => writtenTargetIds.has(t.id)).length,
      targets: myTargets.map((t) => ({
        id: t.id,
        userId: t.userId,
        userName: t.user.name,
        hasWritten: writtenTargetIds.has(t.id),
      })),
    };
  });

  return NextResponse.json(result);
}

export const GET = withErrorHandler(handleGET);
