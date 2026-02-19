"use client";

import { useState, useMemo } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, Plus, ShieldCheck, Lock, Send, ChevronDown, LinkIcon } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { DataTableFilters, FilterConfig } from "@/components/common/data-table-filters";
import { ExportButton } from "@/components/common/export-button";

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
  const { data: session, status: sessionStatus } = useSession();
  const isReady = sessionStatus === "authenticated";
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const { data: received, isLoading: loadingReceived } = useQuery({
    queryKey: ["feedback", "received"],
    queryFn: () => api.get<any[]>("/feedback/identified?type=received"),
    enabled: isReady,
  });

  const { data: anonymous, isLoading: loadingAnonymous } = useQuery({
    queryKey: ["feedback", "anonymous"],
    queryFn: () => api.get<any>(`/feedback/anonymous/${session?.user?.id}`),
    enabled: isReady && !!session?.user?.id,
  });

  const { data: sent, isLoading: loadingSent } = useQuery({
    queryKey: ["feedback", "sent"],
    queryFn: () => api.get<any[]>("/feedback/identified?type=given"),
    enabled: isReady,
  });

  return (
    <div>
      <PageHeader title="피드백" description="받은 피드백을 확인하세요.">
        <div className="flex items-center gap-2">
          <ExportButton
            filename="피드백_내역"
            headers={["작성자", "카테고리", "내용", "날짜"]}
            rows={(received ?? []).map((fb: any) => [
              fb.author?.name ?? "익명",
              categoryLabels[fb.category],
              fb.content,
              format(new Date(fb.createdAt), "yyyy-MM-dd"),
            ])}
            disabled={!received?.length}
          />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              피드백 작성
              <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/feedback/give" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <div>
                  <p className="font-medium">기명 피드백</p>
                  <p className="text-xs text-muted-foreground">이름을 밝히고 피드백을 보냅니다</p>
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/feedback/request" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                <div>
                  <p className="font-medium">무기명 피드백 요청</p>
                  <p className="text-xs text-muted-foreground">익명 링크를 생성하여 공유합니다</p>
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </PageHeader>

      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">기명 피드백</TabsTrigger>
          <TabsTrigger value="anonymous">무기명 피드백</TabsTrigger>
          <TabsTrigger value="sent">보낸 피드백</TabsTrigger>
        </TabsList>

        {/* 기명 피드백 */}
        <TabsContent value="received" className="mt-4">
          <div className="mb-3">
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
          {loadingReceived ? <LoadingState /> : !(received?.filter((fb: any) => !filterValues.category || fb.category === filterValues.category))?.length ? (
            <EmptyState icon={<MessageSquare className="h-12 w-12" />} title="받은 피드백이 없습니다" />
          ) : (
            <div className="space-y-3">
              {received.filter((fb: any) => !filterValues.category || fb.category === filterValues.category).map((fb: any) => (
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

          {/* 무기명 피드백 요청 안내 */}
          <Card className="mb-4 border-dashed">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">무기명 피드백은 어떻게 받나요?</p>
                    <p className="text-xs text-muted-foreground">
                      익명 링크를 생성하고 동료에게 공유하면, 링크를 통해 익명으로 피드백을 받을 수 있습니다.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/feedback/request">링크 생성</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

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

        {/* 보낸 피드백 */}
        <TabsContent value="sent" className="mt-4">
          {loadingSent ? <LoadingState /> : !sent?.length ? (
            <EmptyState icon={<Send className="h-12 w-12" />} title="보낸 피드백이 없습니다" />
          ) : (
            <div className="space-y-3">
              {sent.map((fb: any) => (
                <Card key={fb.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">To:</span>
                        <span className="font-medium text-sm">{fb.target.name}</span>
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
