import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return forbidden();

  await prisma.reviewAssignment.delete({
    where: { id: params.assignmentId },
  });

  return NextResponse.json({ message: "삭제되었습니다." });
}
