import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, badRequest } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get("type"); // "written" | "received"
  const cycleId = searchParams.get("cycleId");
  const targetId = searchParams.get("targetId");

  let where: any;
  if (type === "received") {
    const effectiveTargetId = targetId || user.id;
    // 타인 결과 조회 권한 체크
    if (effectiveTargetId !== user.id) {
      if (user.role === "MEMBER") {
        return forbidden();
      }
      // MANAGER: 본인 팀원만 조회 가능
      if (user.role === "MANAGER") {
        const target = await prisma.user.findUnique({
          where: { id: effectiveTargetId },
          select: { managerId: true },
        });
        if (target?.managerId !== user.id) return forbidden();
      }
    }
    where = { targetId: effectiveTargetId, ...(cycleId ? { cycleId } : {}) };
  } else {
    where = { authorId: user.id, ...(cycleId ? { cycleId } : {}) };
  }

  const reviews = await prisma.review.findMany({
    where,
    include: {
      author: { select: { id: true, name: true } },
      target: { select: { id: true, name: true } },
      cycle: { select: { id: true, name: true } },
      assignment: { select: { reviewType: true } },
      responses: { include: { criterion: { include: { category: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // MEMBER가 type=received 조회 시: 작성자 익명화, 코멘트 제거
  if (type === "received" && user.role === "MEMBER") {
    const anonymized = reviews.map((r: any) => ({
      ...r,
      author: { id: "anonymous", name: "익명" },
      overallComment: null,
      responses: r.responses.map((resp: any) => ({
        ...resp,
        comment: null,
      })),
    }));
    return NextResponse.json(anonymized);
  }

  return NextResponse.json(reviews);
}

async function handlePOST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const { assignmentId, cycleId, targetId, overallComment, responses } = body;

  if (!assignmentId || !cycleId || !targetId) {
    return badRequest("assignmentId, cycleId, and targetId are required");
  }

  // Assignment 소유권 검증: reviewer가 현재 사용자인지 확인
  const assignment = await prisma.reviewAssignment.findUnique({
    where: { id: assignmentId },
    select: { reviewerId: true, status: true },
  });
  if (!assignment) return badRequest("배정을 찾을 수 없습니다.");
  if (assignment.reviewerId !== user.id) return forbidden();
  if (assignment.status === "SUBMITTED") {
    return badRequest("이미 제출된 배정입니다.");
  }

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        assignmentId,
        cycleId,
        authorId: user.id,
        targetId,
        status: "DRAFT",
        overallComment: overallComment || null,
      },
    });

    if (responses && Array.isArray(responses) && responses.length > 0) {
      await tx.reviewResponse.createMany({
        data: responses.map((r: any) => ({
          reviewId: created.id,
          criterionId: r.criterionId,
          rating: r.rating,
          comment: r.comment || null,
        })),
      });
    }

    await tx.reviewAssignment.update({
      where: { id: assignmentId },
      data: { status: "IN_PROGRESS" },
    });

    return created;
  });

  return NextResponse.json(review, { status: 201 });
}

export const GET = withErrorHandler(handleGET);
export const POST = withErrorHandler(handlePOST);
