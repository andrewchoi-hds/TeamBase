import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const template = await prisma.reviewTemplate.findUnique({
    where: { id: params.id },
  });

  if (!template) return notFound("템플릿을 찾을 수 없습니다.");
  return NextResponse.json(template);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const data = await req.json();
  const template = await prisma.reviewTemplate.update({
    where: { id: params.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
    },
  });

  return NextResponse.json(template);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  await prisma.reviewTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "삭제되었습니다." });
}
