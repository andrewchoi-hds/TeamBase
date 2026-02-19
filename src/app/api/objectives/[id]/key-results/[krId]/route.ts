import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function verifyObjectiveOwnership(objectiveId: string, userId: string, userRole: string) {
  const objective = await prisma.objective.findUnique({
    where: { id: objectiveId },
    select: { ownerId: true },
  });
  if (!objective) return { allowed: false, notFound: true } as const;
  return { allowed: objective.ownerId === userId || userRole === "ADMIN", notFound: false } as const;
}

async function handlePATCH(req: NextRequest, { params }: { params: { id: string; krId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const access = await verifyObjectiveOwnership(params.id, user.id, user.role);
  if (access.notFound) return notFound("목표를 찾을 수 없습니다.");
  if (!access.allowed) return forbidden();

  const data = await req.json();

  const updated = await prisma.$transaction(async (tx) => {
    const kr = await tx.keyResult.update({
      where: { id: params.krId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.currentValue !== undefined && { currentValue: data.currentValue }),
        ...(data.targetValue !== undefined && { targetValue: data.targetValue }),
      },
    });

    const progress = kr.targetValue > kr.startValue
      ? ((kr.currentValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100
      : 0;

    const result = await tx.keyResult.update({
      where: { id: params.krId },
      data: { progress: Math.min(100, Math.max(0, progress)) },
    });

    const allKRs = await tx.keyResult.findMany({ where: { objectiveId: params.id } });
    const avgProgress = allKRs.length > 0 ? allKRs.reduce((sum: number, k: any) => sum + k.progress, 0) / allKRs.length : 0;
    await tx.objective.update({ where: { id: params.id }, data: { progress: avgProgress } });

    return result;
  });

  return NextResponse.json(updated);
}

async function handleDELETE(_req: NextRequest, { params }: { params: { id: string; krId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const access = await verifyObjectiveOwnership(params.id, user.id, user.role);
  if (access.notFound) return notFound("목표를 찾을 수 없습니다.");
  if (!access.allowed) return forbidden();

  await prisma.keyResult.delete({ where: { id: params.krId } });
  return NextResponse.json({ message: "삭제되었습니다." });
}

export const PATCH = withErrorHandler(handlePATCH);
export const DELETE = withErrorHandler(handleDELETE);
