"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Target, CheckCircle2, XCircle, Link2, ChevronRight } from "lucide-react";

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    progress: number;
    sourceType: string;
    sourceCycle?: { id: string; name: string } | null;
    feedbackLinks?: { id: string }[];
    targetDate?: string | null;
  };
  editable?: boolean;
  compact?: boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  ACTIVE: { label: "진행 중", variant: "default" },
  COMPLETED: { label: "완료", variant: "secondary" },
  CANCELLED: { label: "취소", variant: "outline" },
};

const sourceLabels: Record<string, string> = {
  REVIEW: "평가",
  FEEDBACK: "피드백",
  SELF: "자기설정",
};

export function GoalCard({ goal, editable = false, compact = false }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [progress, setProgress] = useState(goal.progress);
  const [progressInput, setProgressInput] = useState(String(goal.progress));
  const queryClient = useQueryClient();

  // 서버 데이터 refetch 후 로컬 상태 동기화
  useEffect(() => {
    if (!isEditing) {
      setProgress(goal.progress);
      setProgressInput(String(goal.progress));
    }
  }, [goal.progress, isEditing]);

  const handleProgressChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    if (cleaned === "") {
      setProgressInput("");
      setProgress(0);
      return;
    }
    const num = Math.min(100, Math.max(0, parseInt(cleaned, 10)));
    setProgressInput(String(num));
    setProgress(num);
  };

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.patch(`/development-goals/${goal.id}`, data),
    onSuccess: () => {
      toast.success("목표가 업데이트되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["development-goals"] });
      queryClient.invalidateQueries({ queryKey: ["development-context"] });
      setIsEditing(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusInfo = statusConfig[goal.status] ?? statusConfig.ACTIVE;
  const linkedCount = goal.feedbackLinks?.length ?? 0;

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm truncate">{goal.title}</span>
          <Badge variant={statusInfo.variant} className="text-xs shrink-0">{statusInfo.label}</Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editable && goal.status === "ACTIVE" && isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                type="text"
                inputMode="numeric"
                value={progressInput}
                onChange={(e) => handleProgressChange(e.target.value)}
                className="w-14 h-6 text-xs"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => updateMutation.mutate({ progress })}
              >
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => { setIsEditing(false); setProgress(goal.progress); setProgressInput(String(goal.progress)); }}
              >
                <XCircle className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">{goal.progress}%</span>
              {editable && goal.status === "ACTIVE" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsEditing(true)}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium truncate">{goal.title}</h4>
              <Badge variant={statusInfo.variant} className="text-xs shrink-0">
                {statusInfo.label}
              </Badge>
            </div>
            {goal.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{goal.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{sourceLabels[goal.sourceType] ?? goal.sourceType}</span>
              {goal.sourceCycle && <span>{goal.sourceCycle.name}</span>}
              {linkedCount > 0 && (
                <span className="flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  피드백 {linkedCount}건
                </span>
              )}
            </div>
          </div>

          {editable && goal.status === "ACTIVE" && (
            <div className="shrink-0">
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={progressInput}
                    onChange={(e) => handleProgressChange(e.target.value)}
                    className="w-16 h-7 text-xs"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => updateMutation.mutate({ progress })}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => { setIsEditing(false); setProgress(goal.progress); setProgressInput(String(goal.progress)); }}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsEditing(true)}
                >
                  체크인
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>진행률</span>
            <span>{goal.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
