"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { GradeBadge } from "@/components/review/grade-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { AggregatedReport } from "@/lib/utils/review-aggregation";

export default function ReviewResultsPage({ params }: { params: { cycleId: string } }) {
  const { cycleId } = params;
  const { data: cycle, isLoading } = useQuery({
    queryKey: ["review-cycle", cycleId],
    queryFn: () => api.get<any>(`/review-cycles/${cycleId}`),
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

  // 각 대상자의 보고서를 병렬 조회 (등급 표시용)
  const reportQueries = targets.map((target) => ({
    id: target.id,
    // eslint-disable-next-line react-hooks/rules-of-hooks
    ...useQuery({
      queryKey: ["review-report", cycleId, target.id],
      queryFn: () => api.get<AggregatedReport>(`/review-cycles/${cycleId}/results/${target.id}/report`),
      enabled: target.completed > 0,
    }),
  }));

  const reportMap = new Map<string, AggregatedReport>();
  reportQueries.forEach((q) => {
    if (q.data) reportMap.set(q.id, q.data);
  });

  return (
    <div>
      <PageHeader title={`${cycle.name} - 결과`} description="평가 대상자별 결과를 확인하세요." />
      <div className="space-y-3">
        {targets.map((target) => {
          const report = reportMap.get(target.id);
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
                      {report && report.overallAvgScore > 0 && (
                        <GradeBadge score={report.overallAvgScore} size="sm" />
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
