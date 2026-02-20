import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { developmentGoalService } from "@/lib/services/development-goal.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const goal = await developmentGoalService.getById(params.id);
  if (!goal) return notFound("개선 목표를 찾을 수 없습니다.");

  const isOwner = goal.ownerId === user.id;
  const isAdmin = user.role === "ADMIN";
  const isManager = user.role === "MANAGER" && goal.owner.managerId === user.id;

  if (!isOwner && !isAdmin && !isManager) return forbidden();

  return NextResponse.json(goal);
}

async function handlePATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const goal = await developmentGoalService.getById(params.id);
  if (!goal) return notFound("개선 목표를 찾을 수 없습니다.");

  if (goal.ownerId !== user.id && user.role !== "ADMIN") return forbidden();

  const data = await req.json();
  const updated = await developmentGoalService.update(params.id, data, user.id);

  return NextResponse.json(updated);
}

async function handleDELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const goal = await developmentGoalService.getById(params.id);
  if (!goal) return notFound("개선 목표를 찾을 수 없습니다.");

  if (goal.ownerId !== user.id && user.role !== "ADMIN") return forbidden();

  await developmentGoalService.delete(params.id, user.id);
  return NextResponse.json({ message: "삭제되었습니다." });
}

export const GET = withErrorHandler(handleGET);
export const PATCH = withErrorHandler(handlePATCH);
export const DELETE = withErrorHandler(handleDELETE);
