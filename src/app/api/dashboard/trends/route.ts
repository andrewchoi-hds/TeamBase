import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const isManagerOrAdmin = user.role === "ADMIN" || user.role === "MANAGER";

  // 1. 분기별 평가 점수 변화 (개인)
  const myReviews = await prisma.review.findMany({
    where: { targetId: user.id, status: "SUBMITTED" },
    include: {
      cycle: { select: { name: true, startDate: true, endDate: true } },
      responses: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by cycle
  const scoreTrend: { cycle: string; avgScore: number; date: string }[] = [];
  const byCycle: Record<string, { name: string; date: string; ratings: number[] }> = {};
  myReviews.forEach((r) => {
    const key = r.cycleId;
    if (!byCycle[key]) {
      byCycle[key] = {
        name: r.cycle.name,
        date: r.cycle.startDate.toISOString().slice(0, 7),
        ratings: [],
      };
    }
    r.responses.forEach((resp) => byCycle[key].ratings.push(resp.rating));
  });

  for (const data of Object.values(byCycle)) {
    if (data.ratings.length > 0) {
      scoreTrend.push({
        cycle: data.name,
        avgScore: parseFloat((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(2)),
        date: data.date,
      });
    }
  }

  // 2. 팀원별 OKR 달성률 비교 (매니저/관리자용)
  let okrComparison: { name: string; progress: number }[] = [];
  if (isManagerOrAdmin) {
    const teamMembers = await prisma.user.findMany({
      where: user.role === "ADMIN" ? { isActive: true } : { managerId: user.id, isActive: true },
      select: {
        id: true,
        name: true,
        objectives: {
          where: { status: "ACTIVE" },
          select: { progress: true },
        },
      },
    });

    okrComparison = teamMembers.map((m) => ({
      name: m.name,
      progress: m.objectives.length > 0
        ? parseFloat((m.objectives.reduce((sum, o) => sum + o.progress, 0) / m.objectives.length).toFixed(1))
        : 0,
    })).sort((a, b) => b.progress - a.progress);
  }

  // 3. 월별 피드백 수신/발신 추이 (최근 6개월)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [receivedFeedback, sentFeedback] = await Promise.all([
    prisma.identifiedFeedback.findMany({
      where: { targetId: user.id, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.identifiedFeedback.findMany({
      where: { authorId: user.id, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
  ]);

  // Group by month
  const feedbackTrend: Record<string, { month: string; received: number; sent: number }> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    feedbackTrend[key] = { month: `${d.getMonth() + 1}월`, received: 0, sent: 0 };
  }

  receivedFeedback.forEach((fb) => {
    const key = `${fb.createdAt.getFullYear()}-${String(fb.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (feedbackTrend[key]) feedbackTrend[key].received++;
  });

  sentFeedback.forEach((fb) => {
    const key = `${fb.createdAt.getFullYear()}-${String(fb.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (feedbackTrend[key]) feedbackTrend[key].sent++;
  });

  return NextResponse.json({
    scoreTrend,
    okrComparison,
    feedbackTrend: Object.values(feedbackTrend),
  });
}

export const GET = withErrorHandler(handleGET);
