import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, badRequest } from "@/lib/auth-utils";
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
    // targetId가 지정된 경우: 본인 또는 ADMIN/MANAGER만 다른 사용자 조회 가능
    const effectiveTargetId = targetId || user.id;
    if (effectiveTargetId !== user.id && user.role !== "ADMIN" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
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
