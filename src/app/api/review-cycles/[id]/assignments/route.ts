import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const assignments = await prisma.reviewAssignment.findMany({
    where: { cycleId: params.id },
    include: {
      reviewer: { select: { id: true, name: true, position: true } },
      target: { select: { id: true, name: true, position: true } },
      review: { select: { id: true, status: true } },
    },
  });

  return NextResponse.json(assignments);
}

async function handlePOST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return forbidden();

  const { assignments } = await req.json();
  const result = await prisma.reviewAssignment.createMany({
    data: assignments.map((a: { reviewerId: string; targetId: string; reviewType: string }) => ({
      ...a,
      cycleId: params.id,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json(result, { status: 201 });
}

export const GET = withErrorHandler(handleGET);
export const POST = withErrorHandler(handlePOST);
