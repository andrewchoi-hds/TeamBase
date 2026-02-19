import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(_req: NextRequest, { params }: { params: { id: string } }) {
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

  // 소유권 검증: 작성자, 대상자, 또는 ADMIN만 조회 가능
  const isParticipant = feedback.authorId === user.id || feedback.targetId === user.id;
  if (!isParticipant && user.role !== "ADMIN") return forbidden();

  return NextResponse.json(feedback);
}

async function handlePATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

async function handleDELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const existing = await prisma.identifiedFeedback.findUnique({ where: { id: params.id } });
  if (!existing) return notFound();
  if (existing.authorId !== user.id && user.role !== "ADMIN") return forbidden();

  await prisma.identifiedFeedback.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "삭제되었습니다." });
}

export const GET = withErrorHandler(handleGET);
export const PATCH = withErrorHandler(handlePATCH);
export const DELETE = withErrorHandler(handleDELETE);
