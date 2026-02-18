import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(_req: NextRequest, { params }: { params: { id: string; krId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const checkIns = await prisma.keyResultCheckIn.findMany({
    where: { keyResultId: params.krId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(checkIns);
}

async function handlePOST(req: NextRequest, { params }: { params: { id: string; krId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const data = await req.json();
  const checkIn = await prisma.keyResultCheckIn.create({
    data: {
      keyResultId: params.krId,
      value: data.value,
      note: data.note,
    },
  });

  const kr = await prisma.keyResult.update({
    where: { id: params.krId },
    data: { currentValue: data.value },
  });

  const progress = kr.targetValue > kr.startValue
    ? ((data.value - kr.startValue) / (kr.targetValue - kr.startValue)) * 100
    : 0;

  await prisma.keyResult.update({
    where: { id: params.krId },
    data: { progress: Math.min(100, Math.max(0, progress)) },
  });

  const allKRs = await prisma.keyResult.findMany({ where: { objectiveId: params.id } });
  const avgProgress = allKRs.length > 0 ? allKRs.reduce((sum: number, k: any) => sum + k.progress, 0) / allKRs.length : 0;
  await prisma.objective.update({ where: { id: params.id }, data: { progress: avgProgress } });

  return NextResponse.json(checkIn, { status: 201 });
}

export const GET = withErrorHandler(handleGET);
export const POST = withErrorHandler(handlePOST);
