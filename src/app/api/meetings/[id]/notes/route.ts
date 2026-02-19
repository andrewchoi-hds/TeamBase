import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function verifyMeetingParticipant(meetingId: string, userId: string, userRole: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { organizerId: true, participantId: true },
  });
  if (!meeting) return { allowed: false, notFound: true } as const;
  const isParticipant = meeting.organizerId === userId || meeting.participantId === userId;
  return { allowed: isParticipant || userRole === "ADMIN", notFound: false } as const;
}

async function handleGET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const access = await verifyMeetingParticipant(params.id, user.id, user.role);
  if (access.notFound) return notFound("미팅을 찾을 수 없습니다.");
  if (!access.allowed) return forbidden();

  const notes = await prisma.meetingNote.findMany({
    where: { meetingId: params.id },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

async function handlePOST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const access = await verifyMeetingParticipant(params.id, user.id, user.role);
  if (access.notFound) return notFound("미팅을 찾을 수 없습니다.");
  if (!access.allowed) return forbidden();

  const data = await req.json();
  const note = await prisma.meetingNote.create({
    data: {
      meetingId: params.id,
      authorId: user.id,
      content: data.content,
    },
  });

  return NextResponse.json(note, { status: 201 });
}

export const GET = withErrorHandler(handleGET);
export const POST = withErrorHandler(handlePOST);
