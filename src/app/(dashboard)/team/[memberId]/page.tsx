"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { History, Mail, Building2, User } from "lucide-react";
import { format } from "date-fns";

const roleLabels: Record<string, string> = { ADMIN: "관리자", MANAGER: "팀장", MEMBER: "팀원" };
const categoryLabels: Record<string, string> = { STRENGTH: "강점", IMPROVEMENT: "개선점", GENERAL: "일반" };

export default function TeamMemberPage({ params }: { params: { memberId: string } }) {
  const { data: member, isLoading } = useQuery({
    queryKey: ["user", params.memberId],
    queryFn: () => api.get<any>(`/users/${params.memberId}`),
  });

  const { data: objectives } = useQuery({
    queryKey: ["objectives", params.memberId],
    queryFn: () => api.get<any[]>(`/objectives?ownerId=${params.memberId}`),
    enabled: !!params.memberId,
  });

  const { data: feedbacks } = useQuery({
    queryKey: ["feedback-received", params.memberId],
    queryFn: () => api.get<any[]>(`/feedback/identified?type=received`),
    enabled: !!params.memberId,
  });

  if (isLoading) return <LoadingState rows={5} />;
  if (!member) return null;

  const memberObjectives = objectives ?? [];
  const recentFeedback = (feedbacks ?? []).filter((fb: any) => fb.target?.id === params.memberId).slice(0, 5);

  return (
    <div>
      <PageHeader title={member.name} description="팀원 프로필">
        <Button asChild variant="outline">
          <Link href={`/team/${params.memberId}/history`}>
            <History className="mr-2 h-4 w-4" />
            평정 이력
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {member.name?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{member.name}</h2>
              <p className="text-muted-foreground">{member.position}</p>
              <Badge variant="outline" className="mt-2">{roleLabels[member.role]}</Badge>
            </div>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{member.email}</span>
              </div>
              {member.department && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{member.department.name}</span>
                </div>
              )}
              {member.manager && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>매니저: {member.manager.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">목표 현황</CardTitle></CardHeader>
            <CardContent>
              {memberObjectives.length === 0 ? (
                <p className="text-sm text-muted-foreground">설정된 목표가 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {memberObjectives.map((obj: any) => (
                    <div key={obj.id}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{obj.title}</p>
                        <span className="text-sm font-bold">{Math.round(obj.progress)}%</span>
                      </div>
                      <Progress value={obj.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">최근 피드백</CardTitle></CardHeader>
            <CardContent>
              {recentFeedback.length === 0 ? (
                <p className="text-sm text-muted-foreground">받은 피드백이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {recentFeedback.map((fb: any) => (
                    <div key={fb.id} className="border-l-2 pl-3 py-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{fb.author?.name}</span>
                        <Badge variant="outline" className="text-xs">{categoryLabels[fb.category] ?? fb.category}</Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(fb.createdAt), "yyyy/M/d")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{fb.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
