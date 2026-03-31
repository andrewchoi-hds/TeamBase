import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";
import { reviewService } from "@/lib/services/review.service";
import { aggregateReviewData } from "@/lib/utils/review-aggregation";
import { scoreToGrade } from "@/lib/utils/grade-mapping";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return forbidden();

  // 사이클 및 템플릿 정보 조회
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: params.id },
    select: {
      name: true,
      template: {
        select: {
          categories: {
            select: { id: true, name: true, weight: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!cycle) {
    return NextResponse.json({ error: "평가 주기를 찾을 수 없습니다." }, { status: 404 });
  }

  // 대상자 목록 (제출된 리뷰가 있는)
  const assignments = await prisma.reviewAssignment.findMany({
    where: { cycleId: params.id, status: "SUBMITTED" },
    select: {
      targetId: true,
      target: {
        select: { id: true, name: true, position: true, department: { select: { name: true } } },
      },
    },
  });

  const targetMap = new Map<string, { id: string; name: string; position: string | null; department: string }>();
  for (const a of assignments) {
    if (!targetMap.has(a.targetId)) {
      targetMap.set(a.targetId, {
        id: a.target.id,
        name: a.target.name,
        position: a.target.position,
        department: a.target.department?.name ?? "",
      });
    }
  }

  const categoryWeights = cycle.template?.categories?.map((c) => ({
    categoryId: c.id,
    weight: c.weight,
  }));
  const categoryNames = cycle.template?.categories?.map((c) => c.name) ?? [];

  // 헤더 구성
  const headers = [
    "이름", "부서", "직급", "종합점수", "등급",
    "자기평가", "동료평가", "상향평가", "하향평가",
    ...categoryNames,
  ];

  // 각 대상자별 결과 집계
  const rows: (string | number)[][] = [];
  for (const [targetId, target] of targetMap) {
    const reviews = await reviewService.getReviewResults(params.id, targetId);
    const report = aggregateReviewData(reviews as any, categoryWeights);

    const grade = report.overallAvgScore > 0 ? scoreToGrade(report.overallAvgScore) : null;

    const typeScores = {
      SELF: report.byType["SELF"]?.avgRating ?? "",
      PEER: report.byType["PEER"]?.avgRating ?? "",
      UPWARD: report.byType["UPWARD"]?.avgRating ?? "",
      DOWNWARD: report.byType["DOWNWARD"]?.avgRating ?? "",
    };

    const catScores = categoryNames.map((name) => {
      const cat = report.categoryScores.find((c) => c.categoryName === name);
      return cat ? cat.overall : "";
    });

    rows.push([
      target.name,
      target.department,
      target.position ?? "",
      report.overallAvgScore || "",
      grade?.grade ?? "",
      typeScores.SELF,
      typeScores.PEER,
      typeScores.UPWARD,
      typeScores.DOWNWARD,
      ...catScores,
    ]);
  }

  // 점수 기준 내림차순 정렬
  rows.sort((a, b) => {
    const scoreA = typeof a[3] === "number" ? a[3] : 0;
    const scoreB = typeof b[3] === "number" ? b[3] : 0;
    return scoreB - scoreA;
  });

  return NextResponse.json({ headers, rows, cycleName: cycle.name });
}

export const GET = withErrorHandler(handleGET);
