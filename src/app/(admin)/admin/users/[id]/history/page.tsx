"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { History, Eye } from "lucide-react";
import { format } from "date-fns";

export default function AdminUserHistoryPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const accessLogged = useRef(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["member-reviews", id],
    queryFn: () => api.get<any[]>(`/reviews?type=received&targetId=${id}`),
  });

  const { data: user } = useQuery({
    queryKey: ["user", id],
    queryFn: () => api.get<any>(`/users/${id}`),
  });

  useEffect(() => {
    if (!accessLogged.current) {
      accessLogged.current = true;
      api.post("/access-logs", {
        targetId: id,
        resourceType: "REVIEW",
      }).catch(() => {/* silent */});
    }
  }, [id]);

  return (
    <div>
      <PageHeader title={`${user?.name ?? ""} 평정 이력`} description="과거 평가 결과를 확인합니다." />

      <Alert className="mb-6">
        <Eye className="h-4 w-4" />
        <AlertDescription>
          이 페이지의 열람 기록은 자동으로 저장되며, 대상자에게 알림이 전송됩니다.
        </AlertDescription>
      </Alert>

      {isLoading ? <LoadingState rows={3} /> : !reviews?.length ? (
        <EmptyState icon={<History className="h-12 w-12" />} title="평가 이력이 없습니다" />
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{review.cycle?.name}</CardTitle>
                  <Badge variant="outline">{review.assignment?.reviewType}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const score = review.overallRating
                    ?? (review.responses?.length > 0
                      ? review.responses.reduce((sum: number, r: any) => sum + r.rating, 0) / review.responses.length
                      : null);
                  return score != null ? (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">종합 점수:</span>
                      <span className="font-bold text-lg">{score.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">/ 5.0</span>
                    </div>
                  ) : null;
                })()}
                {review.overallComment && (
                  <p className="text-sm text-muted-foreground">{review.overallComment}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(review.createdAt), "yyyy.M.d")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
