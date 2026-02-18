import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const data = await req.json();
  const dept = await prisma.department.update({
    where: { id: params.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.parentId !== undefined && { parentId: data.parentId }),
    },
  });

  return NextResponse.json(dept);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  await prisma.department.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "삭제되었습니다." });
}
