import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";
import { developmentGoalService } from "@/lib/services/development-goal.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import prisma from "@/lib/prisma";

async function handleGET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const targetUserId = params.id;

  // 권한: 본인 + ADMIN + MANAGER(부하) + 해당 유저에 대한 평가 배정이 있는 평가자
  if (targetUserId !== user.id && user.role !== "ADMIN") {
    const [targetUser, hasAssignment] = await Promise.all([
      prisma.user.findUnique({ where: { id: targetUserId }, select: { managerId: true } }),
      prisma.reviewAssignment.findFirst({
        where: { reviewerId: user.id, targetId: targetUserId },
      }),
    ]);

    const isManager = user.role === "MANAGER" && targetUser?.managerId === user.id;
    if (!isManager && !hasAssignment) return forbidden();
  }

  const context = await developmentGoalService.getDevelopmentContext(targetUserId);
  return NextResponse.json(context);
}

export const GET = withErrorHandler(handleGET);
