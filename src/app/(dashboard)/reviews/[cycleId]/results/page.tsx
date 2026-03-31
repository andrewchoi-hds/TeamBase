"use client";

import { use } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { exportCSV } from "@/lib/export/csv";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { GradeBadge } from "@/components/review/grade-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Download, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function ReviewResultsPage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = use(params);
  const { data: cycle, isLoading } = useQuery({
    queryKey: ["review-cycle", cycleId],
    queryFn: () => api.get<any>(`/review-cycles/${cycleId}`),
  });

  const exportMutation = useMutation({
    mutationFn: () => api.get<{ headers: string[]; rows: (string | number)[][]; cycleName: string }>(
      `/review-cycles/${cycleId}/results/export`
    ),
    onSuccess: (data) => {
      exportCSV({ filename: `${data.cycleName}_전체결과`, headers: data.headers, rows: data.rows });
      toast.success("CSV 파일이 다운로드되었습니다.");
    },
    onError: () => toast.error("내보내기에 실패했습니다."),
  });

  if (isLoading) return <LoadingState rows={5} />;
  if (!cycle) return null;

  // Group assignments by target
  const targetMap = new Map<string, any>();
  cycle.assignments?.forEach((a: any) => {
    if (!targetMap.has(a.target.id)) {
      targetMap.set(a.target.id, { ...a.target, assignments: [], completed: 0, total: 0 });
    }
    const entry = targetMap.get(a.target.id);
    entry.assignments.push(a);
    entry.total++;
    if (a.status === "SUBMITTED") entry.completed++;
  });

  const targets = Array.from(targetMap.values());

  return (
    <div>
      <PageHeader title={`${cycle.name} - 결과`} description="평가 대상자별 결과를 확인하세요.">
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
        >
          {exportMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          전체 결과 CSV
        </Button>
      </PageHeader>
      <div className="space-y-3">
        {targets.map((target) => {
          // 제출된 리뷰의 overallRating 평균으로 등급 표시
          const submittedRatings = target.assignments
            .filter((a: any) => a.status === "SUBMITTED" && a.review?.overallRating != null)
            .map((a: any) => a.review.overallRating as number);
          const avgScore = submittedRatings.length > 0
            ? submittedRatings.reduce((s: number, r: number) => s + r, 0) / submittedRatings.length
            : 0;

          return (
            <Link key={target.id} href={`/reviews/${cycleId}/results/${target.id}`}>
              <Card className="cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {target.name?.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{target.name}</p>
                        <p className="text-sm text-muted-foreground">{target.position}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{target.completed}/{target.total} 완료</Badge>
                      {avgScore > 0 && (
                        <GradeBadge score={avgScore} size="sm" />
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 hidden sm:block">
                        <Progress value={(target.completed / target.total) * 100} className="h-2" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
