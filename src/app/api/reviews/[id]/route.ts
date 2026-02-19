import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const review = await prisma.review.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, name: true } },
      target: { select: { id: true, name: true } },
      cycle: { select: { id: true, name: true } },
      assignment: { select: { reviewType: true } },
      responses: { include: { criterion: { include: { category: true } } } },
    },
  });

  if (!review) return notFound("평가를 찾을 수 없습니다.");

  // 소유권 검증: 작성자, 대상자, 또는 ADMIN/MANAGER만 조회 가능
  const isParticipant = review.authorId === user.id || review.targetId === user.id;
  const isPrivileged = user.role === "ADMIN" || user.role === "MANAGER";
  if (!isParticipant && !isPrivileged) return forbidden();

  return NextResponse.json(review);
}

async function handlePATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const existing = await prisma.review.findUnique({ where: { id: params.id } });
  if (!existing) return notFound("평가를 찾을 수 없습니다.");
  if (existing.authorId !== user.id) return forbidden();

  const data = await req.json();

  const review = await prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({
      where: { id: params.id },
      data: {
        ...(data.overallRating !== undefined && { overallRating: data.overallRating }),
        ...(data.overallComment !== undefined && { overallComment: data.overallComment }),
      },
    });

    if (data.responses && Array.isArray(data.responses)) {
      const existingResps = await tx.reviewResponse.findMany({
        where: { reviewId: params.id },
      });
      const existingMap = new Map(existingResps.map((r: any) => [r.criterionId, r]));

      await Promise.all(
        data.responses.map((resp: any) => {
          const prev: any = existingMap.get(resp.criterionId);
          if (prev) {
            return tx.reviewResponse.update({
              where: { id: prev.id },
              data: { rating: resp.rating, comment: resp.comment },
            });
          }
          return tx.reviewResponse.create({
            data: { reviewId: params.id, criterionId: resp.criterionId, rating: resp.rating, comment: resp.comment },
          });
        })
      );
    }

    return updated;
  });

  return NextResponse.json(review);
}

export const GET = withErrorHandler(handleGET);
export const PATCH = withErrorHandler(handlePATCH);
