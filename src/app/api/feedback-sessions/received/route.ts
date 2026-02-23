import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  // 내가 타겟인 모든 세션 타겟 조회
  const targets = await prisma.feedbackSessionTarget.findMany({
    where: { userId: user.id },
    include: {
      session: {
        select: { id: true, name: true, mode: true, status: true, minResponsesForVisibility: true },
      },
      responses: {
        select: {
          id: true,
          category: true,
          content: true,
          createdAt: true,
          authorId: true,
          author: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // 기명 피드백: NAMED 세션의 모든 응답
  const named: any[] = [];
  // 무기명 피드백: ANONYMOUS 세션에서 임계값 이상일 때만 공개
  const anonymous: { isVisible: boolean; count: number; minRequired: number; feedbacks: any[] } = {
    isVisible: false,
    count: 0,
    minRequired: 3,
    feedbacks: [],
  };

  for (const target of targets) {
    const session = target.session;

    if (session.mode === "NAMED") {
      for (const r of target.responses) {
        named.push({
          id: r.id,
          author: r.author,
          category: r.category,
          content: r.content,
          createdAt: r.createdAt,
          sessionName: session.name,
        });
      }
    } else {
      // ANONYMOUS
      anonymous.count += target.responses.length;
      anonymous.minRequired = session.minResponsesForVisibility;

      if (target.responses.length >= session.minResponsesForVisibility) {
        anonymous.isVisible = true;
        for (const r of target.responses) {
          anonymous.feedbacks.push({
            id: r.id,
            category: r.category,
            content: r.content,
            createdAt: r.createdAt,
            sessionName: session.name,
          });
        }
      }
    }
  }

  // 기명 피드백 최신순 정렬
  named.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ named, anonymous });
}

export const GET = withErrorHandler(handleGET);
