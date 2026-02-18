import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const notes = await prisma.meetingNote.findMany({
    where: { meetingId: params.id },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

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
