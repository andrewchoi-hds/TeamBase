"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { ScoreTrendChart } from "@/components/dashboard/score-trend-chart";
import { OkrComparisonChart } from "@/components/dashboard/okr-comparison-chart";
import { FeedbackTrendChart } from "@/components/dashboard/feedback-trend-chart";

interface TrendData {
  scoreTrend: { cycle: string; avgScore: number; date: string }[];
  okrComparison: { name: string; progress: number }[];
  feedbackTrend: { month: string; received: number; sent: number }[];
}

export default function AnalyticsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const isReady = sessionStatus === "authenticated";
  const isManagerOrAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

  const { data: trends, isLoading } = useQuery({
    queryKey: ["dashboard-trends"],
    queryFn: () => api.get<TrendData>("/dashboard/trends"),
    enabled: isReady,
  });

  if (!isReady || isLoading) return <LoadingState rows={4} />;

  return (
    <div>
      <PageHeader
        title="성과 분석"
        description="평가 점수, OKR 달성률, 피드백 추이를 분석합니다."
      />

      <div className="space-y-6">
        {/* 평가 점수 추이 */}
        <ScoreTrendChart data={trends?.scoreTrend ?? []} />

        {/* 하단 2컬럼 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* OKR 비교 (매니저/관리자만) */}
          {isManagerOrAdmin && (
            <OkrComparisonChart data={trends?.okrComparison ?? []} />
          )}

          {/* 피드백 추이 */}
          <FeedbackTrendChart data={trends?.feedbackTrend ?? []} />
        </div>
      </div>
    </div>
  );
}
