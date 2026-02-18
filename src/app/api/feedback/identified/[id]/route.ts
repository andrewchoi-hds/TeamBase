import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const feedback = await prisma.identifiedFeedback.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, name: true } },
      target: { select: { id: true, name: true } },
    },
  });

  if (!feedback) return notFound();
  return NextResponse.json(feedback);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const existing = await prisma.identifiedFeedback.findUnique({ where: { id: params.id } });
  if (!existing) return notFound();
  if (existing.authorId !== user.id) return forbidden();

  const data = await req.json();
  const feedback = await prisma.identifiedFeedback.update({
    where: { id: params.id },
    data: {
      ...(data.content && { content: data.content }),
      ...(data.category && { category: data.category }),
    },
  });

  return NextResponse.json(feedback);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const existing = await prisma.identifiedFeedback.findUnique({ where: { id: params.id } });
  if (!existing) return notFound();
  if (existing.authorId !== user.id && user.role !== "ADMIN") return forbidden();

  await prisma.identifiedFeedback.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "삭제되었습니다." });
}
