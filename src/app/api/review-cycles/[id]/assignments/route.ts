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

  // ADMIN/MANAGER는 전체 조회, 일반 사용자는 본인 관련 배정만
  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    const filtered = assignments.filter(
      (a: any) => a.reviewer?.id === user.id || a.target?.id === user.id
    );
    return NextResponse.json(filtered);
  }

  return NextResponse.json(assignments);
}

async function handlePOST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return forbidden();

  const { assignments } = await req.json();

  // MANAGER: 본인 팀원만 배정 가능 (reviewer 또는 target이 팀원이어야 함)
  if (user.role === "MANAGER") {
    const memberIds = new Set<string>();
    for (const a of assignments) {
      memberIds.add(a.reviewerId);
      memberIds.add(a.targetId);
    }
    // 본인은 제외하고 체크
    memberIds.delete(user.id);

    if (memberIds.size > 0) {
      const teamMembers = await prisma.user.findMany({
        where: { id: { in: Array.from(memberIds) }, managerId: user.id },
        select: { id: true },
      });
      const teamIds = new Set(teamMembers.map((m) => m.id));
      const unauthorized = Array.from(memberIds).filter((id) => !teamIds.has(id));
      if (unauthorized.length > 0) {
        return NextResponse.json(
          { error: "본인 팀원만 배정할 수 있습니다." },
          { status: 403 }
        );
      }
    }
  }

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
