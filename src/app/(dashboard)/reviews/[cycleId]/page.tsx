"use client";

import { use, useState } from "react";
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
import { Play, BarChart3, Loader2, Plus, CalendarPlus, StopCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DatePicker } from "@/components/common/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CycleStatusDashboard } from "@/components/review/cycle-status-dashboard";
import { AssignmentList } from "@/components/review/assignment-list";
import { reviewTypeLabels, strategyLabels } from "@/lib/constants/review";
import type { Assignment, ReviewCycleDetail } from "@/types";

export default function ReviewCycleDetailPage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = use(params);
  const { data: session, status: sessionStatus } = useSession();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReviewerId, setNewReviewerId] = useState("");
  const [newTargetId, setNewTargetId] = useState("");
  const [newReviewType, setNewReviewType] = useState("PEER");
  const [showForceComplete, setShowForceComplete] = useState(false);
  const [cancelIncomplete] = useState(true);
  const [extendDate, setExtendDate] = useState<Date | undefined>();
  const [extendOpen, setExtendOpen] = useState(false);

  const { data: cycle, isLoading } = useQuery({
    queryKey: ["review-cycle", cycleId],
    queryFn: () => api.get<ReviewCycleDetail>(`/review-cycles/${cycleId}`),
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<any[]>("/users"),
    enabled: showAddForm,
  });

  const extendDeadlineMutation = useMutation({
    mutationFn: (newEndDate: Date) =>
      api.patch(`/review-cycles/${cycleId}`, { endDate: newEndDate.toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-cycle", cycleId] });
      toast.success("마감 기한이 연장되었습니다.");
      setExtendOpen(false);
      setExtendDate(undefined);
    },
    onError: () => toast.error("기한 연장에 실패했습니다."),
  });

  const forceCompleteMutation = useMutation({
    mutationFn: () =>
      api.patch(`/review-cycles/${cycleId}`, {
        status: "COMPLETED",
        cancelIncomplete,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-cycle", cycleId] });
      toast.success("평가 주기가 종료되었습니다.");
      setShowForceComplete(false);
    },
    onError: () => toast.error("평가 종료에 실패했습니다."),
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

  const reopenMutation = useMutation({
    mutationFn: ({ assignmentId, reason }: { assignmentId: string; reason?: string }) =>
      api.post(`/review-cycles/${cycleId}/assignments/${assignmentId}/reopen`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-cycle", cycleId] });
      toast.success("평가가 재오픈되었습니다.");
    },
    onError: () => toast.error("재오픈에 실패했습니다."),
  });

  if (sessionStatus === "loading" || isLoading) return <LoadingState rows={5} />;
  if (!cycle) return null;

  const allAssignments: Assignment[] = cycle.assignments ?? [];
  const myAssignments = allAssignments.filter((a) => a.reviewerId === session?.user?.id);
  const totalAssignments = allAssignments.length;
  const completedAssignments = allAssignments.filter((a) => a.status === "SUBMITTED").length;
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
            <>
              <Popover open={extendOpen} onOpenChange={setExtendOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    기한 연장
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="end">
                  <p className="text-sm font-medium mb-2">새 마감일 선택</p>
                  <DatePicker
                    value={extendDate}
                    onChange={setExtendDate}
                    fromDate={new Date()}
                    placeholder="마감일 선택"
                  />
                  <Button
                    size="sm"
                    className="mt-2 w-full"
                    disabled={!extendDate || extendDeadlineMutation.isPending}
                    onClick={() => extendDate && extendDeadlineMutation.mutate(extendDate)}
                  >
                    {extendDeadlineMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    연장 적용
                  </Button>
                </PopoverContent>
              </Popover>
              <Button variant="destructive" size="sm" onClick={() => setShowForceComplete(true)}>
                <StopCircle className="mr-2 h-4 w-4" />
                평가 종료
              </Button>
            </>
          )}
          {(cycle.status === "ACTIVE" || cycle.status === "COMPLETED") && (
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
          {(cycle.assignmentRules?.strategies?.length ?? 0) > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <span className="text-xs text-muted-foreground shrink-0">배정 규칙:</span>
              <div className="flex flex-wrap gap-1.5">
                {cycle.assignmentRules!.strategies!.map((s: string) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {strategyLabels[s] ?? s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
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
              {myAssignments.map((assignment) => (
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
        <Tabs defaultValue="assignments">
          <TabsList className="mb-4">
            <TabsTrigger value="assignments">배정 목록</TabsTrigger>
            <TabsTrigger value="dashboard">현황 대시보드</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <CycleStatusDashboard cycleId={cycleId} />
          </TabsContent>

          <TabsContent value="assignments">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">전체 평가 현황</CardTitle>
            {cycle.status === "DRAFT" && (
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
                <Plus className="mr-1 h-4 w-4" />
                개별 추가
              </Button>
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

            <AssignmentList
              assignments={allAssignments}
              cycleId={cycleId}
              cycleStatus={cycle.status}
              onDelete={(id) => deleteAssignmentMutation.mutate(id)}
              onReopen={(id, reason) => reopenMutation.mutate({ assignmentId: id, reason })}
              isDeleting={deleteAssignmentMutation.isPending}
            />
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </RoleGate>

      {/* 강제 종료 다이얼로그 */}
      {showForceComplete && (
        <ConfirmDialog
          open={showForceComplete}
          onOpenChange={setShowForceComplete}
          title="평가 주기를 종료하시겠습니까?"
          description={`종료된 평가 주기에서는 더 이상 평가를 제출할 수 없습니다.${cancelIncomplete ? " 미제출 평가는 취소 처리됩니다." : " 미제출 평가는 그대로 유지됩니다."}`}
          confirmText="평가 종료"
          variant="destructive"
          onConfirm={() => forceCompleteMutation.mutate()}
        />
      )}
    </div>
  );
}
