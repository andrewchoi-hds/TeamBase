"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, Ban } from "lucide-react";

const reviewTypeLabels: Record<string, string> = {
  SELF: "자기평가",
  PEER: "동료평가",
  UPWARD: "상향평가",
  DOWNWARD: "하향평가",
};

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
  const { data, isLoading } = useQuery({
    queryKey: ["cycle-status-summary", cycleId],
    queryFn: () => api.get<StatusSummary>(`/review-cycles/${cycleId}/status-summary`),
    refetchInterval: 30000,
  });

  if (isLoading) return <LoadingState rows={3} />;
  if (!data) return null;

  const { progress, overdue, byDepartment, byReviewType } = data;

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
          <CardHeader>
            <CardTitle className="text-lg">미제출자 현황 ({overdue.length}명)</CardTitle>
          </CardHeader>
          <CardContent>
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
                  {overdue.map((item, idx) => (
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
    </div>
  );
}
