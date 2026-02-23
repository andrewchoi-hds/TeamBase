"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const reviewTypeLabels: Record<string, string> = {
  SELF: "자기평가",
  PEER: "동료평가",
  UPWARD: "상향평가",
  DOWNWARD: "하향평가",
};

interface Assignment {
  id: string;
  reviewType: string;
  status: string;
  target: { id: string; name: string; position?: string };
  cycle: { id: string; name: string; status: string; endDate: string };
  review?: { id: string; status: string } | null;
}

export default function ReviewsPage() {
  const { status: sessionStatus } = useSession();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["my-assignments"],
    queryFn: () => api.get<Assignment[]>("/reviews/my-assignments"),
    enabled: sessionStatus === "authenticated",
  });

  // 주기별 그룹핑
  const groupedByCycle = useMemo(() => {
    if (!assignments) return [];
    const map = new Map<string, { cycle: Assignment["cycle"]; assignments: Assignment[] }>();
    for (const a of assignments) {
      const existing = map.get(a.cycle.id);
      if (existing) {
        existing.assignments.push(a);
      } else {
        map.set(a.cycle.id, { cycle: a.cycle, assignments: [a] });
      }
    }
    return Array.from(map.values());
  }, [assignments]);

  if (sessionStatus === "loading" || isLoading) return <LoadingState rows={4} />;

  return (
    <div>
      <PageHeader title="평가" description="배정된 평가를 확인하고 작성하세요." />

      {!groupedByCycle.length ? (
        <EmptyState
          icon={<ClipboardCheck className="h-12 w-12" />}
          title="배정된 평가가 없습니다"
          description="현재 참여할 수 있는 평가 주기가 없습니다."
        />
      ) : (
        <div className="space-y-6">
          {groupedByCycle.map(({ cycle, assignments: cycleAssignments }) => {
            const pending = cycleAssignments.filter((a) => a.status !== "SUBMITTED").length;
            const total = cycleAssignments.length;

            return (
              <Card key={cycle.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{cycle.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          마감: {format(new Date(cycle.endDate), "yyyy년 M월 d일", { locale: ko })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={cycle.status} />
                      {pending > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          미완료 {pending}/{total}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cycleAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-sm">{assignment.target.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {reviewTypeLabels[assignment.reviewType]}
                              </Badge>
                              <StatusBadge status={assignment.status} />
                            </div>
                          </div>
                        </div>
                        {cycle.status === "ACTIVE" && assignment.status !== "SUBMITTED" ? (
                          <Button size="sm" asChild>
                            <Link href={`/reviews/${cycle.id}/write/${assignment.target.id}`}>
                              {assignment.review ? "이어서 작성" : "평가 작성"}
                            </Link>
                          </Button>
                        ) : assignment.status === "SUBMITTED" ? (
                          <Badge variant="secondary" className="text-xs">
                            제출 완료
                          </Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
