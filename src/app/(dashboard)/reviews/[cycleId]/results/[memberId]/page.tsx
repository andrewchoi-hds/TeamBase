"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import dynamic from "next/dynamic";
const ReviewRadarChart = dynamic(() => import("@/components/review/radar-chart").then(m => m.ReviewRadarChart), { ssr: false });
import { GapAnalysis } from "@/components/review/gap-analysis";
import { StrengthWeakness } from "@/components/review/strength-weakness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExportButton } from "@/components/common/export-button";
import { GradeBadge } from "@/components/review/grade-badge";
import { GoalCard } from "@/components/development-goal/goal-card";
import { CreateGoalDialog } from "@/components/development-goal/create-goal-dialog";
import { Target } from "lucide-react";
import type { AggregatedReport } from "@/lib/utils/review-aggregation";

const reviewTypeLabels: Record<string, string> = {
  SELF: "자기평가",
  PEER: "동료평가",
  UPWARD: "상향평가",
  DOWNWARD: "하향평가",
};

export default function MemberReviewResultPage({ params }: { params: { cycleId: string; memberId: string } }) {
  const { cycleId, memberId } = params;

  const { data: session } = useSession();
  const isOwnReport = session?.user?.id === memberId;

  const { data: report, isLoading } = useQuery({
    queryKey: ["review-report", cycleId, memberId],
    queryFn: () => api.get<AggregatedReport & { canViewIndividualReviews?: boolean }>(`/review-cycles/${cycleId}/results/${memberId}/report`),
  });

  const { data: previousGoals } = useQuery({
    queryKey: ["development-goals", memberId],
    queryFn: () => api.get<any[]>(`/development-goals?ownerId=${memberId}`),
    enabled: !!report,
  });

  const { data: reviews } = useQuery({
    queryKey: ["review-results", cycleId, memberId],
    queryFn: () => api.get<any[]>(`/reviews?type=received&cycleId=${cycleId}&targetId=${memberId}`),
    enabled: report?.canViewIndividualReviews !== false,
  });

  if (isLoading) return <LoadingState rows={5} />;
  if (!report) return null;

  const targetReviews = reviews?.filter((r: any) => r.target.id === memberId && r.status === "SUBMITTED") ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${report.targetName} 360도 리뷰 리포트`}
        description={`총 ${report.totalReviews}건의 평가`}
      >
        {report.overallAvgScore > 0 && (
          <GradeBadge score={report.overallAvgScore} size="lg" />
        )}
        <ExportButton
          filename={`${report.targetName}_360도_리포트`}
          headers={["카테고리", "평가 항목", "자기평가", "타인평가", "갭"]}
          rows={report.gapAnalysis.map((item) => [
            item.categoryName,
            item.criterionName,
            item.selfScore.toFixed(1),
            item.othersScore.toFixed(1),
            item.gap.toFixed(1),
          ])}
        />
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(report.byType).map(([type, data]) => (
          <Card key={type}>
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">{reviewTypeLabels[type]}</p>
              <p className="text-2xl font-bold mt-1">{data.avgRating.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">{data.count}건</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Radar Chart */}
      {report.radarData.length > 0 && <ReviewRadarChart data={report.radarData} />}

      {/* Gap Analysis + Strengths/Weaknesses */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GapAnalysis data={report.gapAnalysis} />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">카테고리별 종합 점수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.categoryScores.map((cat) => (
                <div key={cat.categoryId} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{cat.categoryName}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(cat.overall / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{cat.overall.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <StrengthWeakness strengths={report.strengths} weaknesses={report.weaknesses} cycleId={cycleId} isOwnReport={isOwnReport} />

      {/* 이전 개선 목표 현황 */}
      {previousGoals && previousGoals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              개선 목표 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {previousGoals.map((goal: any) => (
              <GoalCard key={goal.id} goal={goal} editable={isOwnReport} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* 개선 목표 설정 CTA */}
      {isOwnReport && report.weaknesses.length > 0 && (
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">약점 영역을 개선 목표로 전환하세요</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  하위 영역을 기반으로 다음 평가까지의 성장 목표를 설정할 수 있습니다.
                </p>
              </div>
              <div className="flex gap-2">
                {report.weaknesses.slice(0, 2).map((w: any) => (
                  <CreateGoalDialog
                    key={w.criterionId}
                    sourceType="REVIEW"
                    sourceCycleId={cycleId}
                    defaultTitle={`${w.criterionName} 역량 강화`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {report.canViewIndividualReviews !== false && (
        <>
          <Separator />

          {/* Individual Reviews */}
          <div>
            <h2 className="text-lg font-semibold mb-4">개별 평가 내역</h2>
            <div className="space-y-4">
              {targetReviews.map((review: any) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{review.author.name}</CardTitle>
                      <Badge variant="outline">{reviewTypeLabels[review.assignment?.reviewType] ?? ""}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {review.responses?.map((resp: any, i: number) => (
                      <div key={resp.id || i}>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm">{resp.criterion?.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(n => (
                                <div key={n} className={`h-2 w-4 rounded-sm ${n <= resp.rating ? "bg-primary" : "bg-muted"}`} />
                              ))}
                            </div>
                            <span className="text-sm font-medium w-6 text-right">{resp.rating}</span>
                          </div>
                        </div>
                        {resp.comment && <p className="text-sm text-muted-foreground mb-2 pl-2 border-l-2">{resp.comment}</p>}
                      </div>
                    ))}
                    {review.overallComment && (
                      <>
                        <Separator className="my-3" />
                        <div>
                          <p className="text-sm font-medium mb-1">종합 의견</p>
                          <p className="text-sm text-muted-foreground">{review.overallComment}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
