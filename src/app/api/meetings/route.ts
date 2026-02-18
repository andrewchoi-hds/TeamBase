import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { notificationService } from "@/lib/services/notification.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const meetings = await prisma.meeting.findMany({
    where: {
      OR: [{ organizerId: user.id }, { participantId: user.id }],
    },
    include: {
      organizer: { select: { id: true, name: true } },
      participant: { select: { id: true, name: true } },
      _count: { select: { notes: true, actionItems: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });

  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const data = await req.json();
  const meeting = await prisma.meeting.create({
    data: {
      title: data.title,
      organizerId: user.id,
      participantId: data.participantId,
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration || 30,
      agenda: data.agenda,
    },
  });

  await notificationService.create({
    userId: data.participantId,
    type: "MEETING_SCHEDULED",
    title: "새로운 미팅",
    message: `${user.name}님이 1:1 미팅을 예약했습니다: ${data.title}`,
    link: `/meetings/${meeting.id}`,
  });

  return NextResponse.json(meeting, { status: 201 });
}
