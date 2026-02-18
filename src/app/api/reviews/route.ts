import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, badRequest } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get("type"); // "written" | "received"
  const cycleId = searchParams.get("cycleId");

  const targetId = searchParams.get("targetId");

  let where: any;
  if (type === "received") {
    where = { targetId: targetId || user.id, ...(cycleId ? { cycleId } : {}) };
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

  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const { assignmentId, cycleId, targetId, overallComment, responses } = body;

    // Validate required fields
    if (!assignmentId || !cycleId || !targetId) {
      return badRequest("assignmentId, cycleId, and targetId are required");
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        assignmentId,
        cycleId,
        authorId: user.id,
        targetId,
        status: "DRAFT",
        overallComment: overallComment || null,
      },
    });

    // Create responses separately (compatible with mock-prisma)
    if (responses && Array.isArray(responses)) {
      for (const r of responses) {
        await prisma.reviewResponse.create({
          data: {
            reviewId: review.id,
            criterionId: r.criterionId,
            rating: r.rating,
            comment: r.comment || null,
          },
        });
      }
    }

    // Update assignment status to IN_PROGRESS
    await prisma.reviewAssignment.update({
      where: { id: assignmentId },
      data: { status: "IN_PROGRESS" },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
