import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const sessions = await prisma.feedbackSession.findMany({
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { targets: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sessions);
}

async function handlePOST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const data = await req.json();
  const { name, description, mode, startDate, endDate, minResponsesForVisibility, targetUserIds, participantUserIds } = data;

  if (!name) {
    return NextResponse.json({ error: "세션 이름을 입력하세요." }, { status: 400 });
  }

  const session = await prisma.feedbackSession.create({
    data: {
      name,
      description,
      mode: mode || "NAMED",
      createdById: user.id,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      minResponsesForVisibility: minResponsesForVisibility ?? 3,
      targets: targetUserIds?.length
        ? {
            create: targetUserIds.map((userId: string) => ({
              userId,
              participants: participantUserIds?.length
                ? { create: participantUserIds.filter((pid: string) => pid !== userId).map((pid: string) => ({ userId: pid })) }
                : undefined,
            })),
          }
        : undefined,
    },
    include: {
      targets: { include: { user: { select: { id: true, name: true } }, _count: { select: { participants: true } } } },
    },
  });

  return NextResponse.json(session, { status: 201 });
}

export const GET = withErrorHandler(handleGET);
export const POST = withErrorHandler(handlePOST);
