"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";

const categoryLabels: Record<string, string> = { STRENGTH: "강점", IMPROVEMENT: "개선점", GENERAL: "일반" };

export default function SentFeedbackPage() {
  const { data: sent, isLoading } = useQuery({
    queryKey: ["feedback", "sent"],
    queryFn: () => api.get<any[]>("/feedback/identified?type=given"),
  });

  return (
    <div>
      <PageHeader title="보낸 피드백" description="내가 작성한 기명 피드백 목록입니다." />
      {isLoading ? <LoadingState /> : !sent?.length ? (
        <EmptyState icon={<MessageSquare className="h-12 w-12" />} title="보낸 피드백이 없습니다" />
      ) : (
        <div className="space-y-3">
          {sent.map((fb: any) => (
            <Card key={fb.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">To:</span>
                    <span className="font-medium text-sm">{fb.target.name}</span>
                    <Badge variant="outline" className="text-xs">{categoryLabels[fb.category]}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(fb.createdAt), "yyyy.M.d")}</span>
                </div>
                <p className="text-sm">{fb.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
