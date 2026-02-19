"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { ReviewRadarChart } from "@/components/review/radar-chart";
import { GapAnalysis } from "@/components/review/gap-analysis";
import { StrengthWeakness } from "@/components/review/strength-weakness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExportButton } from "@/components/common/export-button";
import type { AggregatedReport } from "@/lib/utils/review-aggregation";

const reviewTypeLabels: Record<string, string> = {
  SELF: "자기평가",
  PEER: "동료평가",
  UPWARD: "상향평가",
  DOWNWARD: "하향평가",
};

export default function MemberReviewResultPage({ params }: { params: { cycleId: string; memberId: string } }) {
  const { cycleId, memberId } = params;

  const { data: report, isLoading } = useQuery({
    queryKey: ["review-report", cycleId, memberId],
    queryFn: () => api.get<AggregatedReport>(`/review-cycles/${cycleId}/results/${memberId}/report`),
  });

  const { data: reviews } = useQuery({
    queryKey: ["review-results", cycleId, memberId],
    queryFn: () => api.get<any[]>(`/reviews?type=received&cycleId=${cycleId}`),
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

      <StrengthWeakness strengths={report.strengths} weaknesses={report.weaknesses} />

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
    </div>
  );
}
