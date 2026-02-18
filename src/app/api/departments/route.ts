import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const departments = await prisma.department.findMany({
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true } },
      _count: { select: { users: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(departments);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const data = await req.json();
  const dept = await prisma.department.create({
    data: { name: data.name, parentId: data.parentId },
  });

  return NextResponse.json(dept, { status: 201 });
}
