"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Plus, ShieldCheck, Lock, Target, Check, PenLine } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { DataTableFilters, FilterConfig } from "@/components/common/data-table-filters";
import { ExportButton } from "@/components/common/export-button";
import { GoalCard } from "@/components/development-goal/goal-card";
import { CreateGoalDialog } from "@/components/development-goal/create-goal-dialog";
import { LinkFeedbackDialog } from "@/components/development-goal/link-feedback-dialog";

const FEEDBACK_FILTERS: FilterConfig[] = [
  {
    key: "category",
    label: "카테고리",
    type: "select",
    options: [
      { value: "STRENGTH", label: "강점" },
      { value: "IMPROVEMENT", label: "개선점" },
      { value: "GENERAL", label: "일반" },
    ],
  },
];

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
  const { status: sessionStatus } = useSession();
  const isReady = sessionStatus === "authenticated";
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "received";
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState(initialTab);

  // 받은 피드백 (세션 기반)
  const { data: receivedData, isLoading: loadingReceived } = useQuery({
    queryKey: ["feedback", "received"],
    queryFn: () => api.get<any>("/feedback-sessions/received"),
    enabled: isReady,
  });

  // 작성할 피드백 (세션)
  const { data: mySessions, isLoading: loadingSessions } = useQuery({
    queryKey: ["my-feedback-sessions"],
    queryFn: () => api.get<any[]>("/feedback-sessions/my-sessions"),
    enabled: isReady && activeTab === "write",
  });

  // 개선 목표
  const { data: goals, isLoading: loadingGoals } = useQuery({
    queryKey: ["development-goals"],
    queryFn: () => api.get<any[]>("/development-goals"),
    enabled: isReady && activeTab === "goals",
  });

  const namedFeedbacks = receivedData?.named ?? [];
  const anonymousData = receivedData?.anonymous ?? { isVisible: false, count: 0, minRequired: 3, feedbacks: [] };

  const filteredNamed = namedFeedbacks.filter(
    (fb: any) => !filterValues.category || fb.category === filterValues.category
  );

  return (
    <div>
      <PageHeader title="피드백" description="받은 피드백을 확인하고 세션에 참여하세요.">
        <ExportButton
          filename="피드백_내역"
          headers={["작성자", "카테고리", "내용", "날짜"]}
          rows={namedFeedbacks.map((fb: any) => [
            fb.author?.name ?? "익명",
            categoryLabels[fb.category],
            fb.content,
            format(new Date(fb.createdAt), "yyyy-MM-dd"),
          ])}
          disabled={!namedFeedbacks.length}
        />
      </PageHeader>

      <Tabs defaultValue={initialTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="received">받은 피드백</TabsTrigger>
          <TabsTrigger value="write">작성할 피드백</TabsTrigger>
          <TabsTrigger value="goals">개선 목표</TabsTrigger>
        </TabsList>

        {/* 받은 피드백 (기명 + 무기명 통합) */}
        <TabsContent value="received" className="mt-4 space-y-6">
          {/* 기명 피드백 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">기명 피드백</h3>
              <DataTableFilters
                filters={FEEDBACK_FILTERS}
                values={filterValues}
                onChange={(key, value) => setFilterValues((prev) => {
                  const next = { ...prev };
                  if (value) next[key] = value;
                  else delete next[key];
                  return next;
                })}
                onReset={() => setFilterValues({})}
              />
            </div>
            {loadingReceived ? <LoadingState /> : !filteredNamed.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">받은 기명 피드백이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {filteredNamed.map((fb: any) => (
                  <Card key={fb.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{fb.author?.name}</span>
                          <Badge variant="secondary" className={`text-xs border-0 ${categoryColors[fb.category]}`}>
                            {categoryLabels[fb.category]}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{format(new Date(fb.createdAt), "yyyy.M.d")}</span>
                      </div>
                      <p className="text-sm">{fb.content}</p>
                      <div className="mt-2 flex justify-end">
                        <LinkFeedbackDialog
                          feedbackId={fb.id}
                          feedbackContent={fb.content}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 무기명 피드백 */}
          <div>
            <h3 className="text-sm font-medium mb-3">무기명 피드백</h3>
            <Alert className="mb-3">
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                무기명 피드백은 최소 {anonymousData.minRequired}건 이상 모여야 공개됩니다.
              </AlertDescription>
            </Alert>
            {loadingReceived ? <LoadingState /> : !anonymousData.isVisible ? (
              <div className="flex items-center gap-2 py-4 justify-center text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                현재 {anonymousData.count}건 / 최소 {anonymousData.minRequired}건 필요
              </div>
            ) : (
              <div className="space-y-3">
                {anonymousData.feedbacks.map((fb: any) => (
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
          </div>
        </TabsContent>

        {/* 작성할 피드백 */}
        <TabsContent value="write" className="mt-4">
          {loadingSessions ? <LoadingState /> : !mySessions?.length ? (
            <EmptyState
              icon={<MessageSquare className="h-12 w-12" />}
              title="참여할 피드백 세션이 없습니다"
              description="관리자가 세션을 생성하면 여기에 표시됩니다."
            />
          ) : (
            <div className="space-y-4">
              {mySessions.map((s: any) => (
                <Card key={s.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{s.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {s.mode === "NAMED" ? "기명" : "익명"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {s.writtenCount}/{s.totalTargets} 완료
                        </Badge>
                      </div>
                      {s.endDate && (
                        <span className="text-xs text-muted-foreground">
                          마감 {format(new Date(s.endDate), "yyyy.M.d")}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {s.targets.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded-lg border">
                          <span className="text-sm">{t.userName}</span>
                          {t.hasWritten ? (
                            <Badge variant="secondary" className="text-xs">
                              <Check className="mr-1 h-3 w-3" />
                              완료
                            </Badge>
                          ) : (
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/feedback/sessions/${s.id}/write/${t.id}`}>
                                <PenLine className="mr-1 h-3 w-3" />
                                작성
                              </Link>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 개선 목표 */}
        <TabsContent value="goals" className="mt-4">
          <div className="flex justify-end mb-3">
            <CreateGoalDialog sourceType="SELF" />
          </div>
          {loadingGoals ? <LoadingState /> : !goals?.length ? (
            <EmptyState
              icon={<Target className="h-12 w-12" />}
              title="개선 목표가 없습니다"
              description="피드백을 기반으로 성장 목표를 설정해보세요."
              action={<CreateGoalDialog sourceType="SELF" trigger={<Button><Plus className="mr-2 h-4 w-4" />목표 생성</Button>} />}
            />
          ) : (
            <div className="space-y-3">
              {goals.map((goal: any) => (
                <GoalCard key={goal.id} goal={goal} editable />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
