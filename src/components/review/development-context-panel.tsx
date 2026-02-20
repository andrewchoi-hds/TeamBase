"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GoalCard } from "@/components/development-goal/goal-card";
import { ChevronDown, ChevronUp, Target, TrendingUp, TrendingDown } from "lucide-react";

interface DevelopmentContextPanelProps {
  targetUserId: string;
  defaultExpanded?: boolean;
}

interface DevelopmentContext {
  previousFeedback: {
    strengths: { content: string; author: string | null }[];
    improvements: { content: string; author: string | null }[];
  };
  activeGoals: {
    id: string;
    title: string;
    progress: number;
    sourceType: string;
    linkedFeedbackCount: number;
    sourceCycleName: string | null;
  }[];
  previousCycleSummary: {
    cycleId: string;
    cycleName: string;
    overallScore: number | null;
    reviewCount: number;
  } | null;
}

export function DevelopmentContextPanel({ targetUserId, defaultExpanded = false }: DevelopmentContextPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const { data: context } = useQuery({
    queryKey: ["development-context", targetUserId],
    queryFn: () => api.get<DevelopmentContext>(`/users/${targetUserId}/development-context`),
    enabled: !!targetUserId,
  });

  if (!context) return null;

  const hasContent =
    context.activeGoals.length > 0 ||
    context.previousFeedback.strengths.length > 0 ||
    context.previousFeedback.improvements.length > 0 ||
    context.previousCycleSummary;

  if (!hasContent) return null;

  return (
    <Card className="border-dashed">
      <CardHeader className="py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            이전 피드백 & 개선 목표
            {context.activeGoals.length > 0 && (
              <Badge variant="secondary" className="text-xs">{context.activeGoals.length}건 진행 중</Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {/* 이전 평가 요약 */}
          {context.previousCycleSummary && (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">이전 평가 주기</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{context.previousCycleSummary.cycleName}</span>
                {context.previousCycleSummary.overallScore != null && (
                  <Badge variant="outline" className="text-xs">
                    평균 {context.previousCycleSummary.overallScore.toFixed(1)}점
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  ({context.previousCycleSummary.reviewCount}건)
                </span>
              </div>
            </div>
          )}

          {/* 활성 개선 목표 */}
          {context.activeGoals.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Target className="h-3 w-3" />
                진행 중인 개선 목표
              </p>
              <div className="space-y-1">
                {context.activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={{
                      id: goal.id,
                      title: goal.title,
                      progress: goal.progress,
                      sourceType: goal.sourceType,
                      status: "ACTIVE",
                      feedbackLinks: Array.from({ length: goal.linkedFeedbackCount }, (_, i) => ({ id: String(i) })),
                    }}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          {/* 이전 피드백 요약 */}
          <div className="grid gap-3 md:grid-cols-2">
            {context.previousFeedback.strengths.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                  강점 피드백
                </p>
                <div className="space-y-1.5">
                  {context.previousFeedback.strengths.map((fb, i) => (
                    <div key={i} className="text-xs p-2 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                      <p className="line-clamp-2">{fb.content}</p>
                      {fb.author && <p className="text-muted-foreground mt-0.5">— {fb.author}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {context.previousFeedback.improvements.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                  개선점 피드백
                </p>
                <div className="space-y-1.5">
                  {context.previousFeedback.improvements.map((fb, i) => (
                    <div key={i} className="text-xs p-2 rounded bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                      <p className="line-clamp-2">{fb.content}</p>
                      {fb.author && <p className="text-muted-foreground mt-0.5">— {fb.author}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
