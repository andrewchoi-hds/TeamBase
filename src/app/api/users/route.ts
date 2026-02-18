import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      position: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
      managerId: true,
      manager: { select: { id: true, name: true } },
      isActive: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const data = await req.json();
  const passwordHash = await bcrypt.hash(data.password || "password123", 12);

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role || "MEMBER",
      position: data.position,
      departmentId: data.departmentId,
      managerId: data.managerId,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(newUser, { status: 201 });
}
