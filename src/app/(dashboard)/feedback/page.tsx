"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Plus, ShieldCheck, Lock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

const categoryLabels: Record<string, string> = {
  STRENGTH: "강점",
  IMPROVEMENT: "개선점",
  GENERAL: "일반",
};

const categoryColors: Record<string, string> = {
  STRENGTH: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  IMPROVEMENT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  GENERAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export default function FeedbackPage() {
  const { data: session } = useSession();

  const { data: received, isLoading: loadingReceived } = useQuery({
    queryKey: ["feedback", "received"],
    queryFn: () => api.get<any[]>("/feedback/identified?type=received"),
  });

  const { data: anonymous, isLoading: loadingAnonymous } = useQuery({
    queryKey: ["feedback", "anonymous"],
    queryFn: () => api.get<any>(`/feedback/anonymous/${session?.user?.id}`),
    enabled: !!session?.user?.id,
  });

  return (
    <div>
      <PageHeader title="피드백" description="받은 피드백을 확인하세요.">
        <Button asChild>
          <Link href="/feedback/give"><Plus className="mr-2 h-4 w-4" />피드백 작성</Link>
        </Button>
      </PageHeader>

      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">기명 피드백</TabsTrigger>
          <TabsTrigger value="anonymous">무기명 피드백</TabsTrigger>
          <TabsTrigger value="sent"><Link href="/feedback/sent">보낸 피드백</Link></TabsTrigger>
        </TabsList>

        {/* 기명 피드백 */}
        <TabsContent value="received" className="mt-4">
          {loadingReceived ? <LoadingState /> : !received?.length ? (
            <EmptyState icon={<MessageSquare className="h-12 w-12" />} title="받은 피드백이 없습니다" />
          ) : (
            <div className="space-y-3">
              {received.map((fb: any) => (
                <Card key={fb.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{fb.author.name}</span>
                        <Badge variant="secondary" className={`text-xs border-0 ${categoryColors[fb.category]}`}>
                          {categoryLabels[fb.category]}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(fb.createdAt), "yyyy.M.d")}</span>
                    </div>
                    <p className="text-sm">{fb.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 무기명 피드백 */}
        <TabsContent value="anonymous" className="mt-4">
          <Alert className="mb-4">
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              무기명 피드백은 작성자의 익명성이 보장됩니다. 최소 {anonymous?.minRequired ?? 3}건 이상 모여야 공개됩니다.
            </AlertDescription>
          </Alert>

          {loadingAnonymous ? <LoadingState /> : !anonymous?.isVisible ? (
            <EmptyState
              icon={<Lock className="h-12 w-12" />}
              title="아직 공개할 수 없습니다"
              description={`현재 ${anonymous?.count ?? 0}건의 피드백이 있으며, 최소 ${anonymous?.minRequired ?? 3}건 이상 모여야 공개됩니다.`}
            />
          ) : (
            <div className="space-y-3">
              {anonymous.feedbacks.map((fb: any) => (
                <Card key={fb.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">익명</Badge>
                        <Badge variant="secondary" className={`text-xs border-0 ${categoryColors[fb.category]}`}>
                          {categoryLabels[fb.category]}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(fb.createdAt), "yyyy.M.d")}</span>
                    </div>
                    <p className="text-sm">{fb.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
