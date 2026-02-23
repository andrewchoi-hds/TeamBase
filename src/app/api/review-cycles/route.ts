import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, badRequest } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { reviewService } from "@/lib/services/review.service";

async function handleGET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  // MEMBER는 본인이 배정된 평가 주기만 조회
  const where = user.role === "MEMBER"
    ? { assignments: { some: { OR: [{ reviewerId: user.id }, { targetId: user.id }] } } }
    : {};

  const cycles = await prisma.reviewCycle.findMany({
    where,
    include: {
      _count: { select: { assignments: true, reviews: true } },
      template: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cycles);
}

async function handlePOST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const data = await req.json();

  // templateId 유효성 검증
  if (data.templateId) {
    const templateExists = await prisma.reviewTemplate.findUnique({
      where: { id: data.templateId },
      select: { id: true },
    });
    if (!templateExists) {
      return badRequest("선택한 템플릿이 존재하지 않습니다. 페이지를 새로고침 후 다시 시도해주세요.");
    }
  }

  const cycle = await prisma.reviewCycle.create({
    data: {
      name: data.name,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      templateId: data.templateId || undefined,
      assignmentRules: data.assignmentRules ?? undefined,
    },
  });

  // 배정 규칙이 있으면 자동 배정 생성
  let assignmentCount = 0;
  if (data.assignmentRules?.strategies?.length > 0) {
    const result = await reviewService.generateAndCreateAssignments(
      cycle.id,
      data.assignmentRules.strategies,
      data.assignmentRules.targetUserIds
    );
    assignmentCount = result.count;
  }

  return NextResponse.json({ ...cycle, assignmentCount }, { status: 201 });
}

export const GET = withErrorHandler(handleGET);
export const POST = withErrorHandler(handlePOST);
