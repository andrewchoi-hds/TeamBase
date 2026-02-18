"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const reviewTypeLabels: Record<string, string> = {
  SELF: "자기평가",
  PEER: "동료평가",
  UPWARD: "상향평가",
  DOWNWARD: "하향평가",
};

export default function MemberReviewResultPage({ params }: { params: { cycleId: string; memberId: string } }) {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["review-results", params.cycleId, params.memberId],
    queryFn: () => api.get<any[]>(`/reviews?type=received&cycleId=${params.cycleId}`),
  });

  if (isLoading) return <LoadingState rows={5} />;

  const targetReviews = reviews?.filter((r: any) => r.target.id === params.memberId && r.status === "SUBMITTED") ?? [];
  const targetName = targetReviews[0]?.target?.name ?? "";

  // Calculate averages by category
  const categoryScores: Record<string, { name: string; total: number; count: number }> = {};
  targetReviews.forEach((review: any) => {
    review.responses?.forEach((resp: any) => {
      const catName = resp.criterion?.category?.name ?? "기타";
      if (!categoryScores[catName]) categoryScores[catName] = { name: catName, total: 0, count: 0 };
      categoryScores[catName].total += resp.rating;
      categoryScores[catName].count++;
    });
  });

  return (
    <div>
      <PageHeader title={`${targetName} 평가 결과`} description={`총 ${targetReviews.length}건의 평가`} />

      {/* Summary */}
      {Object.keys(categoryScores).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">카테고리별 평균</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.values(categoryScores).map((cat) => (
                <div key={cat.name} className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">{cat.name}</p>
                  <p className="text-2xl font-bold mt-1">{(cat.total / cat.count).toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">/ 5.0</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Reviews */}
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
  );
}
