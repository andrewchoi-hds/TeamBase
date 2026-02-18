import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET() {
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

async function handlePOST(req: NextRequest) {
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
      agenda: data.agenda || "",
      status: "SCHEDULED",
      recurringId: `recurring-${Date.now()}`,
    },
  });

  return NextResponse.json(meeting, { status: 201 });
}

export const GET = withErrorHandler(handleGET);
export const POST = withErrorHandler(handlePOST);
