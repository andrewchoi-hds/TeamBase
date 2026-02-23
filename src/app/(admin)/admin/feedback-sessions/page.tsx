"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, Users, Play, Square } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

const modeLabels: Record<string, string> = { NAMED: "기명", ANONYMOUS: "익명" };

export default function AdminFeedbackSessionsPage() {
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["admin-feedback-sessions"],
    queryFn: () => api.get<any[]>("/feedback-sessions"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/feedback-sessions/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feedback-sessions"] });
      toast.success("세션 상태가 변경되었습니다.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <LoadingState rows={3} />;

  return (
    <div>
      <PageHeader title="피드백 세션 관리" description="구조화된 피드백 세션을 생성하고 관리합니다.">
        <Button asChild>
          <Link href="/admin/feedback-sessions/new">
            <Plus className="mr-2 h-4 w-4" />
            세션 생성
          </Link>
        </Button>
      </PageHeader>

      {!sessions?.length ? (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title="피드백 세션이 없습니다"
          description="새 세션을 생성하여 팀 피드백을 수집하세요."
          action={
            <Button asChild>
              <Link href="/admin/feedback-sessions/new">
                <Plus className="mr-2 h-4 w-4" />
                첫 세션 생성
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/admin/feedback-sessions/${s.id}`}
                        className="font-medium text-sm hover:underline"
                      >
                        {s.name}
                      </Link>
                      <StatusBadge status={s.status} />
                      <Badge variant="outline" className="text-xs">
                        {modeLabels[s.mode] ?? s.mode}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        대상 {s._count?.targets ?? 0}명
                      </span>
                      {s.endDate && (
                        <span>마감 {format(new Date(s.endDate), "yyyy.M.d")}</span>
                      )}
                      <span>생성: {s.createdBy?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {s.status === "DRAFT" && (
                      <Button
                        size="sm"
                        onClick={() => statusMutation.mutate({ id: s.id, status: "ACTIVE" })}
                        disabled={statusMutation.isPending}
                      >
                        <Play className="mr-1 h-3 w-3" />
                        시작
                      </Button>
                    )}
                    {s.status === "ACTIVE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => statusMutation.mutate({ id: s.id, status: "CLOSED" })}
                        disabled={statusMutation.isPending}
                      >
                        <Square className="mr-1 h-3 w-3" />
                        종료
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
