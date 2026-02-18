"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useNotificationStore } from "@/stores/notification-store";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";

const typeIcons: Record<string, string> = {
  REVIEW_REQUESTED: "📋",
  REVIEW_SUBMITTED: "✅",
  REVIEW_CYCLE_STARTED: "🚀",
  REVIEW_CYCLE_ENDING: "⏰",
  FEEDBACK_RECEIVED: "💬",
  MEETING_SCHEDULED: "📅",
  MEETING_REMINDER: "🔔",
  OKR_CHECK_IN_DUE: "🎯",
  ACCESS_LOG_ALERT: "👁️",
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { setUnreadCount } = useNotificationStore();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<{ notifications: any[]; total: number }>("/notifications"),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setUnreadCount(0);
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setUnreadCount(Math.max(0, (data?.notifications?.filter((n: any) => !n.isRead).length ?? 1) - 1));
    },
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div>
      <PageHeader title="알림" description={`${unreadCount}개의 읽지 않은 알림`}>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()}>
            <CheckCheck className="mr-2 h-4 w-4" />모두 읽음
          </Button>
        )}
      </PageHeader>

      {isLoading ? <LoadingState /> : !notifications.length ? (
        <EmptyState icon={<Bell className="h-12 w-12" />} title="알림이 없습니다" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <Card key={n.id} className={cn(!n.isRead && "border-primary/30 bg-primary/5")}>
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{typeIcons[n.type] ?? "📌"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{n.title}</p>
                      {!n.isRead && <Badge className="h-5 text-[10px]">NEW</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.createdAt), "yyyy.M.d HH:mm")}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {n.link && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={n.link}><Eye className="h-4 w-4" /></Link>
                      </Button>
                    )}
                    {!n.isRead && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markOneMutation.mutate(n.id)}>
                        <CheckCheck className="h-4 w-4" />
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
