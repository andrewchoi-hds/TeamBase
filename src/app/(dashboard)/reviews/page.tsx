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
import { ClipboardCheck, Calendar, Settings, BarChart3, Users } from "lucide-react";
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

interface ReviewCycle {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  _count?: { assignments: number; reviews: number };
}

export default function ReviewsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  // 일반 사용자: 내 배정 조회
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["my-assignments"],
    queryFn: () => api.get<Assignment[]>("/reviews/my-assignments"),
    enabled: sessionStatus === "authenticated" && !isAdmin,
  });

  // 관리자: 전체 평가 주기 조회
  const { data: cycles, isLoading: cyclesLoading } = useQuery({
    queryKey: ["review-cycles"],
    queryFn: () => api.get<ReviewCycle[]>("/review-cycles"),
    enabled: sessionStatus === "authenticated" && isAdmin,
  });

  // 주기별 그룹핑 (일반 사용자)
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

  const isLoading = sessionStatus === "loading" || (isAdmin ? cyclesLoading : assignmentsLoading);
  if (isLoading) return <LoadingState rows={4} />;

  // ===== 관리자 뷰 =====
  if (isAdmin) {
    return (
      <div>
        <PageHeader title="평가" description="평가 주기를 관리하고 진행 현황을 확인합니다.">
          <Button asChild>
            <Link href="/admin/review-cycles/new">새 평가 주기</Link>
          </Button>
        </PageHeader>

        {!cycles?.length ? (
          <EmptyState
            icon={<ClipboardCheck className="h-12 w-12" />}
            title="평가 주기가 없습니다"
            description="새 평가 주기를 생성하여 시작하세요."
          />
        ) : (
          <div className="space-y-4">
            {cycles.map((cycle) => {
              const assignCount = cycle._count?.assignments ?? 0;
              const reviewCount = cycle._count?.reviews ?? 0;

              return (
                <Card key={cycle.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{cycle.name}</h3>
                          <StatusBadge status={cycle.status} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(cycle.startDate), "yy.M.d", { locale: ko })}
                            {" ~ "}
                            {format(new Date(cycle.endDate), "yy.M.d", { locale: ko })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            배정 {assignCount}건
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3.5 w-3.5" />
                            제출 {reviewCount}건
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/reviews/${cycle.id}`}>상세 보기</Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href="/admin/review-cycles">
                            <Settings className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
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

  // ===== 일반 사용자 뷰 =====
  return (
    <div>
      <PageHeader title="평가" description="배정된 평가를 확인하고 작성하세요." />

      {!groupedByCycle.length ? (
        <div className="py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-4">
            <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">배정된 평가가 없습니다</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            아직 참여할 수 있는 평가 주기가 없습니다.
            관리자가 평가 주기를 생성하고 배정하면 이 페이지에 표시됩니다.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">1</div>
              <span>관리자가 평가 생성</span>
            </div>
            <span className="text-muted-foreground/50">→</span>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">2</div>
              <span>나에게 배정</span>
            </div>
            <span className="text-muted-foreground/50">→</span>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">3</div>
              <span>알림 수신 후 작성</span>
            </div>
          </div>
        </div>
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
