import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const [pendingAssignments, completedAssignments, feedbackReceived, upcomingMeetings, objectives] = await Promise.all([
    prisma.reviewAssignment.count({ where: { reviewerId: user.id, status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    prisma.reviewAssignment.count({ where: { reviewerId: user.id, status: "SUBMITTED" } }),
    prisma.identifiedFeedback.count({ where: { targetId: user.id } }),
    prisma.meeting.count({
      where: {
        OR: [{ organizerId: user.id }, { participantId: user.id }],
        scheduledAt: { gte: new Date() },
        status: "SCHEDULED",
      },
    }),
    prisma.objective.findMany({
      where: { ownerId: user.id, status: "ACTIVE" },
      select: { progress: true },
    }),
  ]);

  const avgProgress = objectives.length > 0
    ? Math.round(objectives.reduce((sum: number, o: any) => sum + o.progress, 0) / objectives.length)
    : 0;

  return NextResponse.json({
    pendingAssignments,
    completedAssignments,
    feedbackReceived,
    upcomingMeetings,
    avgOkrProgress: avgProgress,
  });
}
