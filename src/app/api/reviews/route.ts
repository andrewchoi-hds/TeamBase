import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";

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
