import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return forbidden();

  const subordinates = user.role === "ADMIN"
    ? await prisma.user.findMany({ where: { isActive: true }, select: { id: true } })
    : await prisma.user.findMany({ where: { managerId: user.id, isActive: true }, select: { id: true } });

  const memberIds = subordinates.map((s: any) => s.id);

  const [totalMembers, pendingReviews, completedReviews, feedbackCount] = await Promise.all([
    memberIds.length,
    prisma.reviewAssignment.count({ where: { targetId: { in: memberIds }, status: "PENDING" } }),
    prisma.reviewAssignment.count({ where: { targetId: { in: memberIds }, status: "SUBMITTED" } }),
    prisma.feedbackSessionResponse.count({
      where: { target: { userId: { in: memberIds } } },
    }),
  ]);

  return NextResponse.json({
    totalMembers,
    pendingReviews,
    completedReviews,
    feedbackCount,
    completionRate: pendingReviews + completedReviews > 0
      ? Math.round((completedReviews / (pendingReviews + completedReviews)) * 100)
      : 0,
  });
}

export const GET = withErrorHandler(handleGET);
