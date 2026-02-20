import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden, badRequest } from "@/lib/auth-utils";
import { developmentGoalService } from "@/lib/services/development-goal.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import prisma from "@/lib/prisma";

async function handleGET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const searchParams = req.nextUrl.searchParams;
  const ownerId = searchParams.get("ownerId") ?? user.id;
  const status = searchParams.get("status") as "ACTIVE" | "COMPLETED" | "CANCELLED" | null;

  // 다른 사용자의 목표 조회: ADMIN 또는 MANAGER만 가능
  if (ownerId !== user.id && user.role !== "ADMIN") {
    const target = await prisma.user.findUnique({ where: { id: ownerId }, select: { managerId: true } });
    if (user.role !== "MANAGER" || target?.managerId !== user.id) {
      return forbidden();
    }
  }

  const goals = await developmentGoalService.getByOwner(ownerId, status ?? undefined);
  return NextResponse.json(goals);
}

async function handlePOST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const data = await req.json();
  if (!data.title?.trim()) return badRequest("제목을 입력해주세요.");

  const effectiveOwnerId = data.ownerId ?? user.id;

  // 다른 사용자의 목표 대리 생성: ADMIN만
  if (effectiveOwnerId !== user.id && user.role !== "ADMIN") {
    return forbidden();
  }

  const goal = await developmentGoalService.create(
    { ...data, ownerId: effectiveOwnerId },
    user.id,
  );

  return NextResponse.json(goal, { status: 201 });
}

export const GET = withErrorHandler(handleGET);
export const POST = withErrorHandler(handlePOST);
