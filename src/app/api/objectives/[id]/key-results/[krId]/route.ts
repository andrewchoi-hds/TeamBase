import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handlePATCH(req: NextRequest, { params }: { params: { id: string; krId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const data = await req.json();
  const kr = await prisma.keyResult.update({
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

  const updated = await prisma.keyResult.update({
    where: { id: params.krId },
    data: { progress: Math.min(100, Math.max(0, progress)) },
  });

  const allKRs = await prisma.keyResult.findMany({ where: { objectiveId: params.id } });
  const avgProgress = allKRs.length > 0 ? allKRs.reduce((sum: number, k: any) => sum + k.progress, 0) / allKRs.length : 0;
  await prisma.objective.update({ where: { id: params.id }, data: { progress: avgProgress } });

  return NextResponse.json(updated);
}

async function handleDELETE(_req: NextRequest, { params }: { params: { id: string; krId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  await prisma.keyResult.delete({ where: { id: params.krId } });
  return NextResponse.json({ message: "삭제되었습니다." });
}

export const PATCH = withErrorHandler(handlePATCH);
export const DELETE = withErrorHandler(handleDELETE);
