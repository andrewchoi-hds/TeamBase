import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { accessLogService } from "@/lib/services/access-log.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const objective = await prisma.objective.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, position: true } },
      keyResults: {
        include: { checkIns: { orderBy: { createdAt: "desc" }, take: 5 } },
        orderBy: { createdAt: "asc" },
      },
      parent: { select: { id: true, title: true } },
      children: { select: { id: true, title: true, progress: true, status: true } },
    },
  });

  if (!objective) return notFound("목표를 찾을 수 없습니다.");

  if (objective.ownerId !== user.id) {
    await accessLogService.log({
      viewerId: user.id,
      targetId: objective.ownerId,
      resourceType: "OKR",
      resourceId: params.id,
    });
  }

  return NextResponse.json(objective);
}

async function handlePATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const existing = await prisma.objective.findUnique({ where: { id: params.id } });
  if (!existing) return notFound("목표를 찾을 수 없습니다.");
  if (existing.ownerId !== user.id && user.role !== "ADMIN" && user.role !== "MANAGER") return forbidden();

  const data = await req.json();
  const objective = await prisma.objective.update({
    where: { id: params.id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status && { status: data.status }),
      ...(data.progress !== undefined && { progress: data.progress }),
    },
  });

  return NextResponse.json(objective);
}

async function handleDELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const existing = await prisma.objective.findUnique({ where: { id: params.id } });
  if (!existing) return notFound("목표를 찾을 수 없습니다.");
  if (existing.ownerId !== user.id && user.role !== "ADMIN") return forbidden();

  await prisma.objective.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "삭제되었습니다." });
}

export const GET = withErrorHandler(handleGET);
export const PATCH = withErrorHandler(handlePATCH);
export const DELETE = withErrorHandler(handleDELETE);
