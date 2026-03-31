"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, MessageSquare, Target, ArrowRight, Sparkles, PenLine, ShieldCheck, Trophy, AlertTriangle, BookOpen } from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import Link from "next/link";
import { GoalCard } from "@/components/development-goal/goal-card";
import { CreateGoalDialog } from "@/components/development-goal/create-goal-dialog";
import { KudosFeed } from "@/components/kudos/kudos-feed";
import { reviewTypeLabels } from "@/lib/constants/review";
import { scoreToGrade } from "@/lib/utils/grade-mapping";
import { differenceInCalendarDays } from "date-fns";

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const user = session?.user;
  const isReady = sessionStatus === "authenticated";

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-personal"],
    queryFn: () => api.get<any>("/dashboard/personal"),
    enabled: isReady,
  });

  const { data: notifications } = useQuery({
    queryKey: ["recent-notifications"],
    queryFn: () => api.get<any>("/notifications?limit=5"),
    enabled: isReady,
  });

  const { data: myAssignments } = useQuery({
    queryKey: ["my-assignments"],
    queryFn: () => api.get<any[]>("/reviews/my-assignments"),
    enabled: isReady,
  });

  const { data: activeGoals, isLoading: goalsLoading } = useQuery({
    queryKey: ["development-goals", "active"],
    queryFn: () => api.get<any[]>("/development-goals?status=ACTIVE"),
    enabled: isReady,
  });

  const { data: feedbackSessions } = useQuery({
    queryKey: ["my-feedback-sessions"],
    queryFn: () => api.get<any[]>("/feedback-sessions/my-sessions"),
    enabled: isReady,
  });

  const isManagerOrAdmin = user?.role === "ADMIN" || user?.role === "MANAGER";
  const { data: teamStats } = useQuery({
    queryKey: ["dashboard-team"],
    queryFn: () => api.get<any>("/dashboard/team"),
    enabled: isReady && isManagerOrAdmin,
  });

  if (!isReady || statsLoading) return <LoadingState rows={4} variant="cards" />;

  const recentNotifications = notifications?.notifications ?? [];

  // 미완료 평가 배정 (ACTIVE 주기만, PENDING/IN_PROGRESS만)
  const pendingReviews = (myAssignments ?? []).filter(
    (a: any) => a.cycle?.status === "ACTIVE" && (a.status === "PENDING" || a.status === "IN_PROGRESS")
  );

  return (
    <div>
      <PageHeader
        title={`안녕하세요, ${user?.name ?? ""}님`}
        description="오늘의 성과관리 현황을 확인하세요."
      />

      {/* 퀵 가이드 — 할 일이 없을 때 표시 */}
      {pendingReviews.length === 0 && (feedbackSessions?.length ?? 0) === 0 && (activeGoals?.length ?? 0) === 0 && (stats?.pendingAssignments ?? 0) === 0 && (
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/[0.03] to-transparent">
          <CardContent className="py-5">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold mb-1">TeamBase 시작하기</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  현재 진행 중인 작업이 없습니다. 아래 기능들을 활용하여 성과관리를 시작하세요.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { icon: <ClipboardCheck className="h-4 w-4" />, label: "평가", desc: "배정된 평가 확인", href: "/reviews" },
                    { icon: <MessageSquare className="h-4 w-4" />, label: "피드백", desc: "동료 피드백 주고받기", href: "/feedback" },
                    { icon: <Target className="h-4 w-4" />, label: "개선 목표", desc: "성장 목표 설정", href: "/feedback?tab=goals" },
                    { icon: <Sparkles className="h-4 w-4" />, label: "Kudos", desc: "동료 칭찬하기", href: "#kudos" },
                  ].map((item) => (
                    <Link key={item.label} href={item.href}
                      className="flex items-center gap-2 p-2.5 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-muted-foreground">{item.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="진행중인 평가"
          value={stats?.pendingAssignments ?? 0}
          description="할당된 평가"
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <StatCard
          title="받은 피드백"
          value={stats?.feedbackReceived ?? 0}
          description="이번 분기"
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <StatCard
          title="목표 달성률"
          value={`${stats?.avgOkrProgress ?? 0}%`}
          description="개선 목표"
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          title="Kudos"
          value={stats?.kudosReceived ?? 0}
          description="받은 칭찬"
          icon={<Sparkles className="h-5 w-5" />}
        />
      </div>

      {/* 지연 평가 현황 (관리자/매니저) */}
      {isManagerOrAdmin && (teamStats?.overdueCount ?? 0) > 0 && (
        <div className="mb-8">
          <Card className="border-destructive/30 bg-destructive/[0.02]">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">지연된 평가</p>
                    <p className="text-xs text-muted-foreground">
                      마감 기한이 지난 미제출 평가가 <strong>{teamStats.overdueCount}건</strong> 있습니다.
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/reviews">확인하기</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 내가 해야 할 평가 */}
      {pendingReviews.length > 0 && (
        <div className="mb-8">
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <PenLine className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">해야 할 평가</CardTitle>
                <Badge className="text-xs">{pendingReviews.length}</Badge>
              </div>
              <Link
                href="/reviews"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                전체보기
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {pendingReviews.slice(0, 5).map((a: any) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-background"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{a.target?.name}</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {reviewTypeLabels[a.reviewType] ?? a.reviewType}
                          </Badge>
                          <StatusBadge status={a.status} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground truncate">{a.cycle?.name}</span>
                          {a.cycle?.endDate && (() => {
                            const dDay = differenceInCalendarDays(new Date(a.cycle.endDate), new Date());
                            const isUrgent = dDay <= 3;
                            const isOverdue = dDay < 0;
                            return (
                              <Badge
                                variant={isOverdue ? "destructive" : isUrgent ? "default" : "secondary"}
                                className={`text-xs ${isUrgent && !isOverdue ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                              >
                                {isOverdue ? `D+${Math.abs(dDay)}` : dDay === 0 ? "D-Day" : `D-${dDay}`}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/reviews/${a.cycle?.id}/write/${a.target?.id}`}>
                        {a.review ? "이어서 작성" : "평가 작성"}
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 내 평가 결과 */}
      {(stats?.myResults?.length ?? 0) > 0 && (
        <div className="mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">내 평가 결과</CardTitle>
              </div>
              <Link
                href="/reviews"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                전체보기
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {stats.myResults.map((result: any) => {
                  const grade = result.avgScore != null ? scoreToGrade(result.avgScore) : null;
                  return (
                    <div
                      key={result.cycleId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-background"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium truncate">{result.cycleName}</span>
                          {grade && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${grade.bgColor} ${grade.textColor}`}>
                              {grade.grade}
                            </span>
                          )}
                          {result.avgScore != null && (
                            <span className="text-sm text-muted-foreground">{result.avgScore}점</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {Object.entries(result.typeScores as Record<string, number>).map(([type, score]) => (
                            <span key={type} className="text-xs text-muted-foreground">
                              {reviewTypeLabels[type] ?? type} {score}
                            </span>
                          ))}
                          <span className="text-xs text-muted-foreground">
                            · {result.totalReviews}건
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/reviews/${result.cycleId}/results/${user?.id}`}>
                          리포트 보기
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 진행중인 피드백 세션 */}
      {(feedbackSessions?.length ?? 0) > 0 && (
        <div className="mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">작성할 피드백</CardTitle>
                <Badge className="text-xs">
                  {feedbackSessions!.reduce((sum: number, s: any) => sum + s.totalTargets - s.writtenCount, 0)}
                </Badge>
              </div>
              <Link
                href="/feedback?tab=write"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                전체보기
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {feedbackSessions!.map((s: any) => (
                  <div key={s.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{s.name}</span>
                        {s.mode === "ANONYMOUS" && (
                          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {s.writtenCount}/{s.totalTargets}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/feedback/sessions/${s.id}`}>
                          피드백 작성
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 내 개선 목표 */}
      <div className="mb-8">
        {goalsLoading ? (
          <LoadingState rows={1} variant="cards" />
        ) : (activeGoals?.length ?? 0) > 0 ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">내 개선 목표</CardTitle>
                <Badge variant="secondary" className="text-xs">{activeGoals!.length}</Badge>
              </div>
              <Link
                href="/feedback?tab=goals"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                전체보기
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y">
                {activeGoals!.slice(0, 3).map((goal: any) => (
                  <GoalCard key={goal.id} goal={goal} editable compact />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8">
              <div className="flex flex-col items-center text-center max-w-md mx-auto">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-2">개선 목표를 설정해보세요</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  평가 피드백을 바탕으로 성장 목표를 설정하고 진행률을 추적하세요.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                  <span className="px-2 py-1 rounded bg-muted">피드백 확인</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="px-2 py-1 rounded bg-muted">개선 목표 설정</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="px-2 py-1 rounded bg-muted">진행률 체크인</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="px-2 py-1 rounded bg-muted">다음 평가에 반영</span>
                </div>
                <div className="flex items-center gap-3">
                  <CreateGoalDialog
                    sourceType="SELF"
                    trigger={
                      <Button size="sm">
                        <Target className="mr-2 h-4 w-4" />
                        목표 만들기
                      </Button>
                    }
                  />
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/feedback">피드백에서 시작</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 동료 칭찬 */}
      <div className="mb-8">
        <KudosFeed />
      </div>

      {/* 최근 알림 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">최근 알림</CardTitle>
        </CardHeader>
        <CardContent>
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">새로운 알림이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((n: any) => (
                <Link key={n.id} href={n.link ?? "/notifications"}>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${n.isRead ? "bg-muted-foreground/30" : "bg-primary"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
