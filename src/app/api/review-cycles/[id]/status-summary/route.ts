import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return forbidden();

  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: params.id },
    include: {
      assignments: {
        include: {
          reviewer: {
            select: { id: true, name: true, department: { select: { id: true, name: true } } },
          },
          target: {
            select: { id: true, name: true, department: { select: { id: true, name: true } } },
          },
          review: { select: { id: true, status: true, updatedAt: true } },
        },
      },
    },
  });

  if (!cycle) return notFound("평가 주기를 찾을 수 없습니다.");

  const assignments = cycle.assignments;
  const total = assignments.length;
  const submitted = assignments.filter((a) => a.status === "SUBMITTED").length;
  const inProgress = assignments.filter((a) => a.status === "IN_PROGRESS").length;
  const pending = assignments.filter((a) => a.status === "PENDING").length;
  const cancelled = assignments.filter((a) => a.status === "CANCELLED").length;

  // 미제출자 목록
  const overdue = assignments
    .filter((a) => a.status !== "SUBMITTED" && a.status !== "CANCELLED")
    .map((a) => ({
      reviewerId: a.reviewer.id,
      reviewerName: a.reviewer.name,
      reviewerDepartment: a.reviewer.department?.name ?? "-",
      targetName: a.target.name,
      reviewType: a.reviewType,
      status: a.status,
    }));

  // 부서별 진행률
  const deptMap = new Map<string, { name: string; total: number; submitted: number }>();
  assignments.forEach((a) => {
    const deptName = a.reviewer.department?.name ?? "미배정";
    const deptId = a.reviewer.department?.id ?? "unassigned";
    if (!deptMap.has(deptId)) {
      deptMap.set(deptId, { name: deptName, total: 0, submitted: 0 });
    }
    const dept = deptMap.get(deptId)!;
    dept.total++;
    if (a.status === "SUBMITTED") dept.submitted++;
  });
  const byDepartment = Array.from(deptMap.values()).map((d) => ({
    ...d,
    rate: d.total > 0 ? Math.round((d.submitted / d.total) * 100) : 0,
  }));

  // 평가유형별 진행률
  const typeMap = new Map<string, { total: number; submitted: number }>();
  assignments.forEach((a) => {
    if (!typeMap.has(a.reviewType)) {
      typeMap.set(a.reviewType, { total: 0, submitted: 0 });
    }
    const t = typeMap.get(a.reviewType)!;
    t.total++;
    if (a.status === "SUBMITTED") t.submitted++;
  });
  const byReviewType = Array.from(typeMap.entries()).map(([type, d]) => ({
    type,
    ...d,
    rate: d.total > 0 ? Math.round((d.submitted / d.total) * 100) : 0,
  }));

  // 최근 활동
  const recentActivity = assignments
    .filter((a) => a.review)
    .sort((a, b) => new Date(b.review!.updatedAt).getTime() - new Date(a.review!.updatedAt).getTime())
    .slice(0, 10)
    .map((a) => ({
      reviewerName: a.reviewer.name,
      targetName: a.target.name,
      reviewType: a.reviewType,
      status: a.review!.status,
      updatedAt: a.review!.updatedAt,
    }));

  return NextResponse.json({
    progress: {
      total,
      submitted,
      inProgress,
      pending,
      cancelled,
      completionRate: total > 0 ? Math.round((submitted / total) * 100) : 0,
    },
    overdue,
    byDepartment,
    byReviewType,
    recentActivity,
  });
}

export const GET = withErrorHandler(handleGET);
