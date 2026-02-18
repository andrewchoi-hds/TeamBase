"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, Clock, MessageSquare, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function MeetingsPage() {
  const { data: session } = useSession();
  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => api.get<any[]>("/meetings"),
  });

  if (isLoading) return <LoadingState rows={4} />;

  const upcoming = meetings?.filter((m: any) => new Date(m.scheduledAt) >= new Date()) ?? [];
  const past = meetings?.filter((m: any) => new Date(m.scheduledAt) < new Date()) ?? [];

  return (
    <div>
      <PageHeader title="1:1 미팅" description="미팅 일정을 관리하세요.">
        <Button asChild>
          <Link href="/meetings/new"><Plus className="mr-2 h-4 w-4" />새 미팅</Link>
        </Button>
      </PageHeader>

      {!meetings?.length ? (
        <EmptyState icon={<Calendar className="h-12 w-12" />} title="미팅이 없습니다" description="1:1 미팅을 예약해보세요." />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">예정된 미팅</h2>
              <div className="space-y-2">
                {upcoming.map((m: any) => (
                  <MeetingCard key={m.id} meeting={m} userId={session?.user?.id} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">지난 미팅</h2>
              <div className="space-y-2">
                {past.map((m: any) => (
                  <MeetingCard key={m.id} meeting={m} userId={session?.user?.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting, userId }: { meeting: any; userId?: string }) {
  const other = meeting.organizerId === userId ? meeting.participant : meeting.organizer;

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card className="hover:shadow-sm transition-shadow cursor-pointer">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{meeting.title}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span>with {other.name}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(meeting.scheduledAt), "M/d (EEE) HH:mm", { locale: ko })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />{meeting.duration}분
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />{meeting._count?.notes ?? 0}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckSquare className="h-3.5 w-3.5" />{meeting._count?.actionItems ?? 0}
              </div>
              <StatusBadge status={meeting.status} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
