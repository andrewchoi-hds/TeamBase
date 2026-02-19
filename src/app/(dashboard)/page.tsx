"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, MessageSquare, Target, Calendar } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { QuickFeedback } from "@/components/dashboard/quick-feedback";

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

  const { data: meetings } = useQuery({
    queryKey: ["upcoming-meetings"],
    queryFn: () => api.get<any[]>("/meetings"),
    enabled: isReady,
  });

  // Manager/Admin: also fetch team stats
  const isManagerOrAdmin = user?.role === "ADMIN" || user?.role === "MANAGER";
  const { data: teamStats } = useQuery({
    queryKey: ["dashboard-team"],
    queryFn: () => api.get<any>("/dashboard/team"),
    enabled: isReady && isManagerOrAdmin,
  });

  if (!isReady || statsLoading) return <LoadingState rows={4} variant="cards" />;

  const recentNotifications = notifications?.notifications ?? [];
  const upcomingMeetings = (meetings ?? [])
    .filter((m: any) => m.status === "SCHEDULED")
    .slice(0, 3);

  return (
    <div>
      <PageHeader
        title={`안녕하세요, ${user?.name ?? ""}님`}
        description="오늘의 성과관리 현황을 확인하세요."
      />

      {/* Personal Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
          description="현재 OKR"
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          title="예정 미팅"
          value={stats?.upcomingMeetings ?? 0}
          description="이번 주"
          icon={<Calendar className="h-5 w-5" />}
        />
      </div>

      {/* Team Stats (Manager/Admin only) */}
      {isManagerOrAdmin && teamStats && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">팀 현황</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="팀원 수" value={teamStats.totalMembers ?? 0} description="활성 멤버" />
            <StatCard title="미완료 평가" value={teamStats.pendingReviews ?? 0} description="대기중" />
            <StatCard title="완료된 평가" value={teamStats.completedReviews ?? 0} description="제출됨" />
            <StatCard title="완료율" value={`${teamStats.completionRate ?? 0}%`} description="평가 진행률" />
          </div>
        </div>
      )}

      {/* Activity + Schedule + Quick Feedback */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">다가오는 미팅</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">예정된 미팅이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((m: any) => (
                  <Link key={m.id} href={`/meetings/${m.id}`}>
                    <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm font-medium">{m.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.organizer?.name} &middot; {m.participant?.name}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {m.scheduledAt ? format(new Date(m.scheduledAt), "yyyy/M/d") : ""}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Feedback */}
        <QuickFeedback />
      </div>
    </div>
  );
}
