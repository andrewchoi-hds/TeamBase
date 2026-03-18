"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Loader2, CheckCircle, AlertTriangle, RefreshCw, TrendingUp } from "lucide-react";

interface SummaryContent {
  strengths: string[];
  improvements: string[];
  overall: string;
}

interface SummaryResponse {
  summary: {
    id: string;
    content: SummaryContent;
    createdAt: string;
  } | null;
}

interface AiSummaryCardProps {
  cycleId: string;
  memberId: string;
}

export function AiSummaryCard({ cycleId, memberId }: AiSummaryCardProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ai-summary", cycleId, memberId],
    queryFn: () => api.get<SummaryResponse>(`/review-cycles/${cycleId}/results/${memberId}/summary`),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post<SummaryResponse>(`/review-cycles/${cycleId}/results/${memberId}/summary`),
    onSuccess: (result) => {
      queryClient.setQueryData(["ai-summary", cycleId, memberId], result);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const summary = data?.summary?.content;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 요약이 없는 경우 생성 버튼 표시
  if (!summary) {
    return (
      <Card className="border-dashed border-primary/30 bg-primary/[0.02]">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">AI 리뷰 요약</p>
                <p className="text-xs text-muted-foreground">
                  다면평가 결과를 AI가 분석하여 핵심 인사이트를 제공합니다.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI 요약 생성
                </>
              )}
            </Button>
          </div>
          {error && (
            <div className="flex items-start gap-2 mt-3 p-2.5 rounded-md bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-destructive font-medium">요약 생성에 실패했습니다</p>
                <p className="text-xs text-destructive/80 mt-0.5">
                  {error.includes("API") || error.includes("key")
                    ? "AI 서비스 연결에 문제가 있습니다. 관리자에게 문의하세요."
                    : error.includes("review") || error.includes("평가")
                      ? "분석할 평가 데이터가 충분하지 않습니다."
                      : error}
                </p>
                <button
                  type="button"
                  onClick={() => { setError(null); generateMutation.mutate(); }}
                  className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 font-medium mt-1.5"
                >
                  <RefreshCw className="h-3 w-3" />
                  다시 시도
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // 요약 결과 표시
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI 리뷰 요약
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            AI 생성
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 강점 */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">강점</span>
          </div>
          <ul className="space-y-1.5 ml-6">
            {summary.strengths.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground list-disc">{s}</li>
            ))}
          </ul>
        </div>

        {/* 개선 영역 */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">개선 영역</span>
          </div>
          <ul className="space-y-1.5 ml-6">
            {summary.improvements.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground list-disc">{s}</li>
            ))}
          </ul>
        </div>

        {/* 전체 인상 */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">종합 평가</span>
          </div>
          <p className="text-sm text-muted-foreground ml-6">{summary.overall}</p>
        </div>

        <p className="text-[11px] text-muted-foreground/60 pt-2 border-t">
          AI가 생성한 요약입니다. 참고용으로 활용해주세요.
        </p>
      </CardContent>
    </Card>
  );
}
