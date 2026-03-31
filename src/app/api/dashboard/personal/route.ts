import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const [pendingAssignments, completedAssignments, feedbackReceived, activeGoals, myResults] = await Promise.all([
    prisma.reviewAssignment.count({ where: { reviewerId: user.id, status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    prisma.reviewAssignment.count({ where: { reviewerId: user.id, status: "SUBMITTED" } }),
    prisma.feedbackSessionResponse.count({
      where: { target: { userId: user.id } },
    }),
    prisma.developmentGoal.findMany({
      where: { ownerId: user.id, status: "ACTIVE" },
      select: { progress: true },
    }),
    // 내가 대상자인 완료된 평가 결과 (ACTIVE/COMPLETED 주기)
    prisma.reviewCycle.findMany({
      where: {
        status: { in: ["ACTIVE", "COMPLETED"] },
        assignments: {
          some: {
            targetId: user.id,
            status: "SUBMITTED",
          },
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
        endDate: true,
        assignments: {
          where: { targetId: user.id, status: "SUBMITTED" },
          select: {
            reviewType: true,
            review: {
              select: { overallRating: true },
            },
          },
        },
      },
      orderBy: { endDate: "desc" },
      take: 3,
    }),
  ]);

  const avgGoalProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum: number, g: any) => sum + g.progress, 0) / activeGoals.length)
    : 0;

  // 주기별 평균 점수 + 유형별 점수 계산
  const myResultsSummary = myResults.map((cycle) => {
    const ratings = cycle.assignments
      .map((a) => a.review?.overallRating)
      .filter((r): r is number => r != null);
    const avgScore = ratings.length > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
      : null;

    // 유형별 평균
    const byType: Record<string, { sum: number; count: number }> = {};
    for (const a of cycle.assignments) {
      const rating = a.review?.overallRating;
      if (rating == null) continue;
      if (!byType[a.reviewType]) byType[a.reviewType] = { sum: 0, count: 0 };
      byType[a.reviewType].sum += rating;
      byType[a.reviewType].count += 1;
    }
    const typeScores: Record<string, number> = {};
    for (const [type, { sum, count }] of Object.entries(byType)) {
      typeScores[type] = Math.round((sum / count) * 10) / 10;
    }

    return {
      cycleId: cycle.id,
      cycleName: cycle.name,
      cycleStatus: cycle.status,
      endDate: cycle.endDate,
      totalReviews: ratings.length,
      avgScore,
      typeScores,
    };
  });

  return NextResponse.json({
    pendingAssignments,
    completedAssignments,
    feedbackReceived,
    avgOkrProgress: avgGoalProgress,
    myResults: myResultsSummary,
  });
}

export const GET = withErrorHandler(handleGET);
