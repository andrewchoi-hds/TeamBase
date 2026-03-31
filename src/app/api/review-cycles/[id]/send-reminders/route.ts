import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { notificationService } from "@/lib/services/notification.service";

async function handlePOST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const body = await req.json().catch(() => ({}));
  const reviewerIds: string[] | undefined = body.reviewerIds;

  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, status: true },
  });

  if (!cycle) {
    return NextResponse.json({ error: "평가 주기를 찾을 수 없습니다." }, { status: 404 });
  }
  if (cycle.status !== "ACTIVE") {
    return NextResponse.json({ error: "활성 상태의 평가 주기만 독촉할 수 있습니다." }, { status: 400 });
  }

  // 미제출 배정자 조회
  const assignments = await prisma.reviewAssignment.findMany({
    where: {
      cycleId: params.id,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      ...(reviewerIds?.length ? { reviewerId: { in: reviewerIds } } : {}),
    },
    select: { reviewerId: true },
  });

  const uniqueUserIds = Array.from(new Set(assignments.map((a) => a.reviewerId)));

  if (uniqueUserIds.length === 0) {
    return NextResponse.json({ sent: 0, message: "독촉할 대상이 없습니다." });
  }

  const notifications = uniqueUserIds.map((userId) => ({
    userId,
    type: "REVIEW_CYCLE_ENDING" as const,
    title: "평가 작성 독촉",
    message: `관리자가 "${cycle.name}" 평가 작성을 독촉했습니다. 미완료 평가를 작성해주세요.`,
    link: `/reviews/${cycle.id}`,
  }));

  await notificationService.createMany(notifications);

  return NextResponse.json({ sent: uniqueUserIds.length });
}

export const POST = withErrorHandler(handlePOST);
