import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { auditLogService } from "@/lib/services/audit-log.service";

async function handleGET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: params.id },
    include: {
      template: { include: { categories: { include: { criteria: true }, orderBy: { order: "asc" } } } },
      assignments: {
        include: {
          reviewer: { select: { id: true, name: true, position: true } },
          target: { select: { id: true, name: true, position: true } },
          review: { select: { id: true, status: true, overallRating: true } },
        },
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!cycle) return notFound("평가 주기를 찾을 수 없습니다.");

  // ADMIN/MANAGER 또는 해당 평가 주기에 배정된 사용자만 조회 가능
  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    const isAssigned = cycle.assignments.some(
      (a: any) => a.reviewer?.id === user.id || a.target?.id === user.id
    );
    if (!isAssigned) return forbidden();
  }

  return NextResponse.json(cycle);
}

async function handlePATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return forbidden();

  const data = await req.json();

  // 강제 종료: status가 COMPLETED이고 cancelIncomplete가 true면 미제출 배정 취소
  if (data.status === "COMPLETED" && data.cancelIncomplete) {
    const existing = await prisma.reviewCycle.findUnique({
      where: { id: params.id },
      select: { status: true },
    });
    if (existing?.status === "ACTIVE") {
      await prisma.$transaction(async (tx) => {
        await tx.reviewCycle.update({
          where: { id: params.id },
          data: { status: "COMPLETED" },
        });
        await tx.reviewAssignment.updateMany({
          where: { cycleId: params.id, status: { in: ["PENDING", "IN_PROGRESS"] } },
          data: { status: "CANCELLED" },
        });
      });

      await auditLogService.log({
        action: "STATUS_CHANGE",
        entityType: "REVIEW_CYCLE",
        entityId: params.id,
        userId: user.id,
        changes: data,
        metadata: { forceCompleted: true, cancelIncomplete: true },
      });

      const updated = await prisma.reviewCycle.findUnique({ where: { id: params.id } });
      return NextResponse.json(updated);
    }
  }

  const cycle = await prisma.reviewCycle.update({
    where: { id: params.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status && { status: data.status }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
    },
  });

  await auditLogService.log({
    action: data.status ? "STATUS_CHANGE" : "UPDATE",
    entityType: "REVIEW_CYCLE",
    entityId: params.id,
    userId: user.id,
    changes: data,
  });

  return NextResponse.json(cycle);
}

async function handleDELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  await prisma.reviewCycle.delete({ where: { id: params.id } });

  await auditLogService.log({
    action: "DELETE",
    entityType: "REVIEW_CYCLE",
    entityId: params.id,
    userId: user.id,
  });

  return NextResponse.json({ message: "삭제되었습니다." });
}

export const GET = withErrorHandler(handleGET);
export const PATCH = withErrorHandler(handlePATCH);
export const DELETE = withErrorHandler(handleDELETE);
