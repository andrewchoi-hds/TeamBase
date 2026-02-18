import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: params.id },
    include: {
      template: { include: { categories: { include: { criteria: true }, orderBy: { order: "asc" } } } },
      assignments: {
        include: {
          reviewer: { select: { id: true, name: true, position: true } },
          target: { select: { id: true, name: true, position: true } },
          review: { select: { id: true, status: true } },
        },
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!cycle) return notFound("평가 주기를 찾을 수 없습니다.");
  return NextResponse.json(cycle);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return forbidden();

  const data = await req.json();
  const cycle = await prisma.reviewCycle.update({
    where: { id: params.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status && { status: data.status }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
    },
  });

  return NextResponse.json(cycle);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  await prisma.reviewCycle.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "삭제되었습니다." });
}
