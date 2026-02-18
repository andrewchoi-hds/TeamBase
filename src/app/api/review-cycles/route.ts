import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const cycles = await prisma.reviewCycle.findMany({
    include: {
      _count: { select: { assignments: true, reviews: true } },
      template: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cycles);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return forbidden();

  const data = await req.json();
  const cycle = await prisma.reviewCycle.create({
    data: {
      name: data.name,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      templateId: data.templateId || undefined,
    },
  });

  return NextResponse.json(cycle, { status: 201 });
}
