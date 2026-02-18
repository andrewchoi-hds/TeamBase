import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const items = await prisma.actionItem.findMany({
    where: { meetingId: params.id },
    include: { assignee: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const data = await req.json();
  const item = await prisma.actionItem.create({
    data: {
      meetingId: params.id,
      assigneeId: data.assigneeId || user.id,
      title: data.title,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
