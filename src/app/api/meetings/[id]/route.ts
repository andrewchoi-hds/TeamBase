import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const meeting = await prisma.meeting.findUnique({
    where: { id: params.id },
    include: {
      organizer: { select: { id: true, name: true } },
      participant: { select: { id: true, name: true } },
      notes: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      actionItems: {
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!meeting) return notFound("미팅을 찾을 수 없습니다.");

  // 소유권 검증: 주최자, 참가자, 또는 ADMIN만 조회 가능
  const isMeetingParticipant = meeting.organizerId === user.id || meeting.participantId === user.id;
  if (!isMeetingParticipant && user.role !== "ADMIN") return forbidden();

  return NextResponse.json(meeting);
}

async function handlePATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const existing = await prisma.meeting.findUnique({ where: { id: params.id } });
  if (!existing) return notFound("미팅을 찾을 수 없습니다.");
  if (existing.organizerId !== user.id && existing.participantId !== user.id && user.role !== "ADMIN") return forbidden();

  const data = await req.json();
  const meeting = await prisma.meeting.update({
    where: { id: params.id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.status && { status: data.status }),
      ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
      ...(data.agenda !== undefined && { agenda: data.agenda }),
    },
  });

  return NextResponse.json(meeting);
}

async function handleDELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const existing = await prisma.meeting.findUnique({ where: { id: params.id } });
  if (!existing) return notFound("미팅을 찾을 수 없습니다.");
  if (existing.organizerId !== user.id && user.role !== "ADMIN") return forbidden();

  await prisma.meeting.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "삭제되었습니다." });
}

export const GET = withErrorHandler(handleGET);
export const PATCH = withErrorHandler(handlePATCH);
export const DELETE = withErrorHandler(handleDELETE);
