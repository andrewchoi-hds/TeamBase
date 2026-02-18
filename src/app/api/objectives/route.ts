import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const searchParams = req.nextUrl.searchParams;
  const level = searchParams.get("level");
  const ownerId = searchParams.get("ownerId");

  const where: any = {};
  if (level) where.level = level;
  if (ownerId) where.ownerId = ownerId;
  else if (user.role === "MEMBER") where.ownerId = user.id;

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

export async function POST(req: NextRequest) {
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
