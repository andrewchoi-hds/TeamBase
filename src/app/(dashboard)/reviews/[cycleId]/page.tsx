"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { LoadingState } from "@/components/common/loading-state";
import { RoleGate } from "@/components/common/role-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Play, BarChart3, Loader2 } from "lucide-react";

const reviewTypeLabels: Record<string, string> = {
  SELF: "자기평가",
  PEER: "동료평가",
  UPWARD: "상향평가",
  DOWNWARD: "하향평가",
};

export default function ReviewCycleDetailPage({ params }: { params: { cycleId: string } }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data: cycle, isLoading } = useQuery({
    queryKey: ["review-cycle", params.cycleId],
    queryFn: () => api.get<any>(`/review-cycles/${params.cycleId}`),
  });

  const activateMutation = useMutation({
    mutationFn: () => api.patch(`/review-cycles/${params.cycleId}`, { status: "ACTIVE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-cycle", params.cycleId] });
      toast.success("평가 주기가 시작되었습니다.");
    },
  });

  if (isLoading) return <LoadingState rows={5} />;
  if (!cycle) return null;

  const myAssignments = cycle.assignments?.filter((a: any) => a.reviewerId === session?.user?.id) ?? [];
  const totalAssignments = cycle.assignments?.length ?? 0;
  const completedAssignments = cycle.assignments?.filter((a: any) => a.status === "SUBMITTED").length ?? 0;
  const progressPercent = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

  return (
    <div>
      <PageHeader title={cycle.name} description={cycle.description}>
        <StatusBadge status={cycle.status} />
        <RoleGate roles={["ADMIN", "MANAGER"]}>
          {cycle.status === "DRAFT" && (
            <Button onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending}>
              {activateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              평가 시작
            </Button>
          )}
          {cycle.status === "ACTIVE" && (
            <Button asChild variant="outline">
              <Link href={`/reviews/${params.cycleId}/results`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                결과 보기
              </Link>
            </Button>
          )}
        </RoleGate>
      </PageHeader>

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">전체 진행률</span>
            <span className="text-sm text-muted-foreground">{completedAssignments}/{totalAssignments} 완료</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span>기간: {format(new Date(cycle.startDate), "yyyy.M.d", { locale: ko })} ~ {format(new Date(cycle.endDate), "yyyy.M.d", { locale: ko })}</span>
          </div>
        </CardContent>
      </Card>

      {/* My Assignments */}
      {myAssignments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">내 평가 할당</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myAssignments.map((assignment: any) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{assignment.target.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{reviewTypeLabels[assignment.reviewType]}</Badge>
                        <StatusBadge status={assignment.status} />
                      </div>
                    </div>
                  </div>
                  {assignment.status !== "SUBMITTED" && cycle.status === "ACTIVE" && (
                    <Button size="sm" asChild>
                      <Link href={`/reviews/${params.cycleId}/write/${assignment.target.id}`}>
                        {assignment.review ? "이어서 작성" : "평가 작성"}
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Assignments (Manager/Admin view) */}
      <RoleGate roles={["ADMIN", "MANAGER"]}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">전체 평가 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cycle.assignments?.map((assignment: any) => (
                <div key={assignment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{assignment.reviewer.name}</span>
                    <span className="text-muted-foreground">→</span>
                    <span>{assignment.target.name}</span>
                    <Badge variant="outline" className="text-xs">{reviewTypeLabels[assignment.reviewType]}</Badge>
                  </div>
                  <StatusBadge status={assignment.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </RoleGate>
    </div>
  );
}
