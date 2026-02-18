"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";

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

  return (
    <div>
      <PageHeader title={`${cycle.name} - 결과`} description="평가 대상자별 결과를 확인하세요." />
      <div className="space-y-3">
        {targets.map((target) => (
          <Link key={target.id} href={`/reviews/${cycleId}/results/${target.id}`}>
            <Card className="hover:shadow-sm transition-shadow cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{target.name}</p>
                      <p className="text-sm text-muted-foreground">{target.position}</p>
                    </div>
                    <Badge variant="outline">{target.completed}/{target.total} 완료</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <Progress value={(target.completed / target.total) * 100} className="h-2" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
