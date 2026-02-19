import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function verifyObjectiveAccess(objectiveId: string, userId: string, userRole: string) {
  const objective = await prisma.objective.findUnique({
    where: { id: objectiveId },
    select: { ownerId: true },
  });
  if (!objective) return { allowed: false, notFound: true } as const;
  const isOwner = objective.ownerId === userId;
  const isPrivileged = userRole === "ADMIN" || userRole === "MANAGER";
  return { allowed: isOwner || isPrivileged, notFound: false } as const;
}

async function handleGET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const access = await verifyObjectiveAccess(params.id, user.id, user.role);
  if (access.notFound) return notFound("목표를 찾을 수 없습니다.");
  if (!access.allowed) return forbidden();

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

  const access = await verifyObjectiveAccess(params.id, user.id, user.role);
  if (access.notFound) return notFound("목표를 찾을 수 없습니다.");
  if (!access.allowed) return forbidden();

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
