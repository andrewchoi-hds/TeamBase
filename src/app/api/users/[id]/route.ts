import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { accessLogService } from "@/lib/services/access-log.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const targetUser = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, email: true, role: true, position: true,
      department: { select: { id: true, name: true } },
      manager: { select: { id: true, name: true } },
      createdAt: true,
    },
  });

  if (!targetUser) return notFound("사용자를 찾을 수 없습니다.");

  // Log profile access
  await accessLogService.log({
    viewerId: user.id,
    targetId: params.id,
    resourceType: "PROFILE",
  });

  return NextResponse.json(targetUser);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN" && user.id !== params.id) return forbidden();

  const data = await req.json();
  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.position !== undefined && { position: data.position }),
      ...(data.role && user.role === "ADMIN" && { role: data.role }),
      ...(data.departmentId !== undefined && user.role === "ADMIN" && { departmentId: data.departmentId }),
      ...(data.managerId !== undefined && user.role === "ADMIN" && { managerId: data.managerId }),
      ...(data.isActive !== undefined && user.role === "ADMIN" && { isActive: data.isActive }),
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(updated);
}
