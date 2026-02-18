"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, ClipboardCheck, MessageSquare, Target } from "lucide-react";

export default function TeamReportPage() {
  const { data: teamStats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-team"],
    queryFn: () => api.get<any>("/dashboard/team"),
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => api.get<any[]>("/users"),
  });

  const { data: objectives } = useQuery({
    queryKey: ["team-objectives"],
    queryFn: () => api.get<any[]>("/objectives"),
  });

  if (statsLoading || membersLoading) return <LoadingState rows={4} />;

  const teamObjectives = (objectives ?? []).filter((o: any) => o.level === "TEAM" || o.level === "COMPANY");

  return (
    <div>
      <PageHeader title="팀 리포트" description="팀 성과 현황을 한눈에 확인하세요." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="팀원 수" value={teamStats?.totalMembers ?? 0} icon={<Users className="h-5 w-5" />} />
        <StatCard
          title="평가 완료율"
          value={`${teamStats?.completionRate ?? 0}%`}
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <StatCard title="피드백 수" value={teamStats?.feedbackCount ?? 0} icon={<MessageSquare className="h-5 w-5" />} />
        <StatCard
          title="평균 OKR 달성률"
          value={`${teamObjectives.length > 0 ? Math.round(teamObjectives.reduce((s: number, o: any) => s + o.progress, 0) / teamObjectives.length) : 0}%`}
          icon={<Target className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">팀원 현황</CardTitle></CardHeader>
          <CardContent>
            {!members?.length ? (
              <p className="text-sm text-muted-foreground">팀원이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {members.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.position ?? m.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{m.department?.name ?? ""}</Badge>
                      <Badge
                        variant={m.role === "ADMIN" ? "default" : m.role === "MANAGER" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {m.role === "ADMIN" ? "관리자" : m.role === "MANAGER" ? "팀장" : "팀원"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">팀 목표 달성률</CardTitle></CardHeader>
          <CardContent>
            {teamObjectives.length === 0 ? (
              <p className="text-sm text-muted-foreground">팀 목표가 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {teamObjectives.map((obj: any) => (
                  <div key={obj.id}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate flex-1">{obj.title}</p>
                      <span className="text-sm font-bold ml-2">{Math.round(obj.progress)}%</span>
                    </div>
                    <Progress value={obj.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{obj.owner?.name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
