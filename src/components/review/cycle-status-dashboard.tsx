"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { toast } from "sonner";
import { CheckCircle2, Clock, AlertCircle, Ban, Bell, Loader2 } from "lucide-react";
import { reviewTypeLabels } from "@/lib/constants/review";

interface StatusSummary {
  progress: {
    total: number;
    submitted: number;
    inProgress: number;
    pending: number;
    cancelled: number;
    completionRate: number;
  };
  overdue: {
    reviewerId: string;
    reviewerName: string;
    reviewerDepartment: string;
    targetName: string;
    reviewType: string;
    status: string;
  }[];
  byDepartment: { name: string; total: number; submitted: number; rate: number }[];
  byReviewType: { type: string; total: number; submitted: number; rate: number }[];
  recentActivity: {
    reviewerName: string;
    targetName: string;
    reviewType: string;
    status: string;
    updatedAt: string;
  }[];
}

export function CycleStatusDashboard({ cycleId }: { cycleId: string }) {
  const [showReminderConfirm, setShowReminderConfirm] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterReviewType, setFilterReviewType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["cycle-status-summary", cycleId],
    queryFn: () => api.get<StatusSummary>(`/review-cycles/${cycleId}/status-summary`),
    refetchInterval: 30000,
  });

  const sendReminderMutation = useMutation({
    mutationFn: () => api.post<{ sent: number }>(`/review-cycles/${cycleId}/send-reminders`, {}),
    onSuccess: (res) => {
      toast.success(`${res.sent}명에게 독촉 알림을 발송했습니다.`);
      setShowReminderConfirm(false);
    },
    onError: () => toast.error("독촉 발송에 실패했습니다."),
  });

  if (isLoading) return <LoadingState rows={3} />;
  if (!data) return null;

  const { progress, overdue, byDepartment, byReviewType } = data;

  // 미제출 목록 필터링
  const departments = Array.from(new Set(overdue.map((o) => o.reviewerDepartment))).filter(Boolean);
  const reviewTypes = Array.from(new Set(overdue.map((o) => o.reviewType)));
  const filteredOverdue = overdue.filter((item) => {
    if (filterDepartment !== "all" && item.reviewerDepartment !== filterDepartment) return false;
    if (filterReviewType !== "all" && item.reviewType !== filterReviewType) return false;
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Progress Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-muted-foreground">제출 완료</span>
            </div>
            <p className="text-2xl font-bold">{progress.submitted}</p>
            <p className="text-xs text-muted-foreground">전체 {progress.total}건 중</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-muted-foreground">진행 중</span>
            </div>
            <p className="text-2xl font-bold">{progress.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-muted-foreground">미시작</span>
            </div>
            <p className="text-2xl font-bold">{progress.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Ban className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-muted-foreground">취소</span>
            </div>
            <p className="text-2xl font-bold">{progress.cancelled}</p>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">전체 완료율</span>
            <span className="text-sm font-bold">{progress.completionRate}%</span>
          </div>
          <Progress value={progress.completionRate} className="h-3" />
        </CardContent>
      </Card>

      {/* Department Progress */}
      {byDepartment.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">부서별 진행률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {byDepartment.map((dept) => (
                <div key={dept.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{dept.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {dept.submitted}/{dept.total} ({dept.rate}%)
                    </span>
                  </div>
                  <Progress value={dept.rate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Type Progress */}
      {byReviewType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">유형별 진행률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {byReviewType.map((rt) => (
                <div key={rt.type} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{reviewTypeLabels[rt.type] ?? rt.type}</p>
                    <p className="text-xs text-muted-foreground">{rt.submitted}/{rt.total}건</p>
                  </div>
                  <Badge variant={rt.rate === 100 ? "default" : "outline"}>{rt.rate}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Table */}
      {overdue.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">미제출자 현황 ({filteredOverdue.length}/{overdue.length}명)</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReminderConfirm(true)}
              disabled={sendReminderMutation.isPending}
            >
              {sendReminderMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Bell className="mr-1 h-3 w-3" />}
              독촉 발송
            </Button>
          </CardHeader>
          <CardContent>
            {/* 필터 */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="부서" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 부서</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterReviewType} onValueChange={setFilterReviewType}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 유형</SelectItem>
                  {reviewTypes.map((t) => (
                    <SelectItem key={t} value={t}>{reviewTypeLabels[t] ?? t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="PENDING">미시작</SelectItem>
                  <SelectItem value="IN_PROGRESS">진행중</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">평가자</th>
                    <th className="text-left py-2 font-medium">부서</th>
                    <th className="text-left py-2 font-medium">대상자</th>
                    <th className="text-left py-2 font-medium">유형</th>
                    <th className="text-left py-2 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOverdue.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2">{item.reviewerName}</td>
                      <td className="py-2 text-muted-foreground">{item.reviewerDepartment}</td>
                      <td className="py-2">{item.targetName}</td>
                      <td className="py-2">
                        <Badge variant="outline" className="text-xs">
                          {reviewTypeLabels[item.reviewType] ?? item.reviewType}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Badge variant={item.status === "PENDING" ? "secondary" : "outline"} className="text-xs">
                          {item.status === "PENDING" ? "미시작" : "진행중"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 독촉 발송 확인 */}
      <ConfirmDialog
        open={showReminderConfirm}
        onOpenChange={setShowReminderConfirm}
        title="독촉 알림을 발송하시겠습니까?"
        description={`미제출 평가자 전원에게 독촉 알림(이메일 포함)을 발송합니다.`}
        confirmText="발송"
        onConfirm={() => sendReminderMutation.mutate()}
      />
    </div>
  );
}
