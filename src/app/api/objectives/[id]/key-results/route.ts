import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const keyResults = await prisma.keyResult.findMany({
    where: { objectiveId: params.id },
    include: { checkIns: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(keyResults);
}

async function handlePOST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const data = await req.json();
  const kr = await prisma.keyResult.create({
    data: {
      objectiveId: params.id,
      title: data.title,
      type: data.type || "NUMERIC",
      startValue: data.startValue || 0,
      targetValue: data.targetValue,
      unit: data.unit,
    },
  });

  return NextResponse.json(kr, { status: 201 });
}

export const GET = withErrorHandler(handleGET);
export const POST = withErrorHandler(handlePOST);
