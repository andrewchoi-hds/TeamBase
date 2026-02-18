import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const recurring = await prisma.meeting.findMany({
    where: {
      OR: [{ organizerId: user.id }, { participantId: user.id }],
      recurringId: { not: null },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json(recurring);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const data = await req.json();

  // Create recurring meeting template
  const meeting = await prisma.meeting.create({
    data: {
      title: data.title,
      organizerId: user.id,
      participantId: data.participantId,
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration || 30,
      agenda: data.agenda || "",
      status: "SCHEDULED",
      recurringId: `recurring-${Date.now()}`,
    },
  });

  return NextResponse.json(meeting, { status: 201 });
}
