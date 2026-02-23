import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const session = await prisma.feedbackSession.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true } },
      targets: {
        include: {
          user: { select: { id: true, name: true, position: true, department: { select: { name: true } } } },
          participants: { include: { user: { select: { id: true, name: true } } } },
          _count: { select: { responses: true } },
        },
      },
    },
  });

  if (!session) return notFound("세션을 찾을 수 없습니다.");

  // 참여자가 아닌 일반 유저는 접근 불가 (ADMIN 제외)
  if (user.role !== "ADMIN") {
    const isParticipant = session.targets.some(
      (t) => t.userId === user.id || t.participants.some((p) => p.userId === user.id)
    );
    if (!isParticipant) return forbidden();
  }

  return NextResponse.json(session);
}

async function handlePATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const data = await req.json();
  const { status, name, description, endDate } = data;

  const session = await prisma.feedbackSession.update({
    where: { id: params.id },
    data: {
      ...(status && { status }),
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(endDate && { endDate: new Date(endDate) }),
    },
  });

  return NextResponse.json(session);
}

export const GET = withErrorHandler(handleGET);
export const PATCH = withErrorHandler(handlePATCH);
