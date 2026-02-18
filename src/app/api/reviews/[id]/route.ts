import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
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
  return NextResponse.json(review);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  // Ownership check - only the author can edit
  const existing = await prisma.review.findUnique({ where: { id: params.id } });
  if (!existing) return notFound("평가를 찾을 수 없습니다.");
  if (existing.authorId !== user.id) return forbidden();

  const data = await req.json();
  const review = await prisma.review.update({
    where: { id: params.id },
    data: {
      ...(data.overallRating !== undefined && { overallRating: data.overallRating }),
      ...(data.overallComment !== undefined && { overallComment: data.overallComment }),
    },
  });

  // Upsert responses (find existing by composite key, then update or create)
  if (data.responses && Array.isArray(data.responses)) {
    for (const resp of data.responses) {
      const existingResp = await prisma.reviewResponse.findFirst({
        where: { reviewId: params.id, criterionId: resp.criterionId },
      });
      if (existingResp) {
        await prisma.reviewResponse.update({
          where: { id: existingResp.id },
          data: { rating: resp.rating, comment: resp.comment },
        });
      } else {
        await prisma.reviewResponse.create({
          data: { reviewId: params.id, criterionId: resp.criterionId, rating: resp.rating, comment: resp.comment },
        });
      }
    }
  }

  return NextResponse.json(review);
}
