import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const [pendingAssignments, completedAssignments, feedbackReceived, activeGoals] = await Promise.all([
    prisma.reviewAssignment.count({ where: { reviewerId: user.id, status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    prisma.reviewAssignment.count({ where: { reviewerId: user.id, status: "SUBMITTED" } }),
    prisma.feedbackSessionResponse.count({
      where: { target: { userId: user.id } },
    }),
    prisma.developmentGoal.findMany({
      where: { ownerId: user.id, status: "ACTIVE" },
      select: { progress: true },
    }),
  ]);

  const avgGoalProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum: number, g: any) => sum + g.progress, 0) / activeGoals.length)
    : 0;

  return NextResponse.json({
    pendingAssignments,
    completedAssignments,
    feedbackReceived,
    avgOkrProgress: avgGoalProgress,
  });
}

export const GET = withErrorHandler(handleGET);
