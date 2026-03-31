import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { scoreToGrade } from "@/lib/utils/grade-mapping";

async function handleGET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return forbidden();

  // 최근 완료된 사이클 (최대 5개)
  const recentCycles = await prisma.reviewCycle.findMany({
    where: { status: "COMPLETED" },
    orderBy: { endDate: "desc" },
    take: 5,
    select: { id: true, name: true, endDate: true },
  });

  if (recentCycles.length === 0) {
    return NextResponse.json({
      departmentScores: [],
      gradeDistribution: [],
      completionTrend: [],
    });
  }

  const cycleIds = recentCycles.map((c) => c.id);

  // 1. 부서별 평균 점수 (최근 사이클 전체)
  const reviewsWithDept = await prisma.review.findMany({
    where: {
      cycleId: { in: cycleIds },
      status: "SUBMITTED",
      overallRating: { not: null },
    },
    select: {
      overallRating: true,
      target: {
        select: { department: { select: { name: true } } },
      },
    },
  });

  const deptMap = new Map<string, { sum: number; count: number }>();
  for (const r of reviewsWithDept) {
    const deptName = r.target.department?.name ?? "미배정";
    const entry = deptMap.get(deptName) ?? { sum: 0, count: 0 };
    entry.sum += r.overallRating!;
    entry.count++;
    deptMap.set(deptName, entry);
  }

  const departmentScores = Array.from(deptMap.entries())
    .map(([name, { sum, count }]) => ({
      name,
      avgScore: parseFloat((sum / count).toFixed(2)),
      count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  // 2. 등급 분포 (가장 최근 사이클)
  const latestCycleId = recentCycles[0].id;
  const latestReviews = await prisma.review.groupBy({
    by: ["targetId"],
    where: {
      cycleId: latestCycleId,
      status: "SUBMITTED",
      overallRating: { not: null },
    },
    _avg: { overallRating: true },
  });

  const gradeCounts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  for (const r of latestReviews) {
    const avg = r._avg.overallRating;
    if (avg != null) {
      const grade = scoreToGrade(avg);
      gradeCounts[grade.grade] = (gradeCounts[grade.grade] ?? 0) + 1;
    }
  }

  const gradeDistribution = Object.entries(gradeCounts).map(([grade, count]) => ({
    grade,
    count,
  }));

  // 3. 주기별 완료율 추이
  const completionTrend = [];
  for (const cycle of recentCycles.reverse()) {
    const stats = await prisma.reviewAssignment.groupBy({
      by: ["status"],
      where: { cycleId: cycle.id },
      _count: true,
    });
    const total = stats.reduce((sum, s) => sum + s._count, 0);
    const submitted = stats.find((s) => s.status === "SUBMITTED")?._count ?? 0;
    completionTrend.push({
      cycleName: cycle.name,
      endDate: cycle.endDate,
      completionRate: total > 0 ? Math.round((submitted / total) * 100) : 0,
      total,
      submitted,
    });
  }

  return NextResponse.json({
    departmentScores,
    gradeDistribution,
    completionTrend,
    latestCycleName: recentCycles[0].name,
  });
}

export const GET = withErrorHandler(handleGET);
