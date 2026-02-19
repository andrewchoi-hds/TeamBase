"use client";

import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Play, BarChart3, Loader2, Plus, Trash2 } from "lucide-react";
import { BulkAssignmentDialog } from "@/components/review/bulk-assignment-dialog";

const reviewTypeLabels: Record<string, string> = {
  SELF: "자기평가",
  PEER: "동료평가",
  UPWARD: "상향평가",
  DOWNWARD: "하향평가",
};

export default function ReviewCycleDetailPage({ params }: { params: { cycleId: string } }) {
  const { cycleId } = params;
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReviewerId, setNewReviewerId] = useState("");
  const [newTargetId, setNewTargetId] = useState("");
  const [newReviewType, setNewReviewType] = useState("PEER");

  const { data: cycle, isLoading } = useQuery({
    queryKey: ["review-cycle", cycleId],
    queryFn: () => api.get<any>(`/review-cycles/${cycleId}`),
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<any[]>("/users"),
    enabled: showAddForm,
  });

  const activateMutation = useMutation({
    mutationFn: () => api.patch(`/review-cycles/${cycleId}`, { status: "ACTIVE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-cycle", cycleId] });
      toast.success("평가 주기가 시작되었습니다.");
    },
  });

  const addAssignmentMutation = useMutation({
    mutationFn: () =>
      api.post(`/review-cycles/${cycleId}/assignments`, {
        assignments: [{ reviewerId: newReviewerId, targetId: newTargetId, reviewType: newReviewType }],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-cycle", cycleId] });
      toast.success("평가 배정이 추가되었습니다.");
      setShowAddForm(false);
      setNewReviewerId("");
      setNewTargetId("");
      setNewReviewType("PEER");
    },
    onError: () => toast.error("배정 추가에 실패했습니다."),
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      api.delete(`/review-cycles/${cycleId}/assignments/${assignmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-cycle", cycleId] });
      toast.success("배정이 삭제되었습니다.");
    },
    onError: () => toast.error("배정 삭제에 실패했습니다."),
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
              <Link href={`/reviews/${cycleId}/results`}>
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
                      <Link href={`/reviews/${cycleId}/write/${assignment.target.id}`}>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">전체 평가 현황</CardTitle>
            {cycle.status === "DRAFT" && (
              <div className="flex items-center gap-2">
                <BulkAssignmentDialog
                  cycleId={cycleId}
                  existingAssignments={(cycle.assignments ?? []).map((a: any) => ({
                    reviewerId: a.reviewer.id,
                    targetId: a.target.id,
                    reviewType: a.reviewType,
                  }))}
                />
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
                  <Plus className="mr-1 h-4 w-4" />
                  개별 추가
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Add Assignment Form */}
            {showAddForm && cycle.status === "DRAFT" && (
              <div className="mb-4 p-4 rounded-lg border bg-muted/50 space-y-3">
                <p className="text-sm font-medium">새 평가 배정</p>
                <div className="grid grid-cols-3 gap-3">
                  <Select value={newReviewerId} onValueChange={setNewReviewerId}>
                    <SelectTrigger><SelectValue placeholder="평가자 선택" /></SelectTrigger>
                    <SelectContent>
                      {(users ?? []).map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.position})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newTargetId} onValueChange={setNewTargetId}>
                    <SelectTrigger><SelectValue placeholder="대상자 선택" /></SelectTrigger>
                    <SelectContent>
                      {(users ?? []).map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.position})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newReviewType} onValueChange={setNewReviewType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(reviewTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => addAssignmentMutation.mutate()}
                    disabled={!newReviewerId || !newTargetId || addAssignmentMutation.isPending}
                  >
                    {addAssignmentMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    추가
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>취소</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {cycle.assignments?.map((assignment: any) => (
                <div key={assignment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{assignment.reviewer.name}</span>
                    <span className="text-muted-foreground">→</span>
                    <span>{assignment.target.name}</span>
                    <Badge variant="outline" className="text-xs">{reviewTypeLabels[assignment.reviewType]}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={assignment.status} />
                    {cycle.status === "DRAFT" && assignment.status === "PENDING" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {(!cycle.assignments || cycle.assignments.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">배정된 평가가 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </RoleGate>
    </div>
  );
}
