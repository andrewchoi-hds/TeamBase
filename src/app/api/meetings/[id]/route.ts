import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, notFound } from "@/lib/auth-utils";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
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
  return NextResponse.json(meeting);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  await prisma.meeting.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "삭제되었습니다." });
}
