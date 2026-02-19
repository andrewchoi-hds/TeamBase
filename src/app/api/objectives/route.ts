import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const searchParams = req.nextUrl.searchParams;
  const level = searchParams.get("level");
  const ownerId = searchParams.get("ownerId");

  const where: any = {};
  if (level) where.level = level;
  if (ownerId) {
    // 다른 사용자의 목표 조회: ADMIN/MANAGER만 가능
    if (ownerId !== user.id && user.role !== "ADMIN" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    where.ownerId = ownerId;
  } else if (user.role === "MEMBER") {
    where.ownerId = user.id;
  }

  const objectives = await prisma.objective.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, position: true } },
      keyResults: { orderBy: { createdAt: "asc" } },
      parent: { select: { id: true, title: true } },
      _count: { select: { children: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(objectives);
}

async function handlePOST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const data = await req.json();
  const objective = await prisma.objective.create({
    data: {
      title: data.title,
      description: data.description,
      ownerId: data.ownerId || user.id,
      level: data.level || "INDIVIDUAL",
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      parentId: data.parentId,
    },
    include: { keyResults: true },
  });

  return NextResponse.json(objective, { status: 201 });
}

export const GET = withErrorHandler(handleGET);
export const POST = withErrorHandler(handlePOST);
