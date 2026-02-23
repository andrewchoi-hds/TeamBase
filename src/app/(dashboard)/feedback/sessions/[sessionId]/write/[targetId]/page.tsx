"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedQuery } from "@/hooks/use-authenticated-query";
import { api } from "@/lib/api/client";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "STRENGTH", label: "강점", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "IMPROVEMENT", label: "개선점", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "GENERAL", label: "일반", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
];

export default function WriteFeedbackPage({
  params,
}: {
  params: Promise<{ sessionId: string; targetId: string }>;
}) {
  const { sessionId, targetId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState("GENERAL");
  const [content, setContent] = useState("");

  const { data: fbSession, isLoading, isReady } = useAuthenticatedQuery<any>(
    ["feedback-session", sessionId],
    `/feedback-sessions/${sessionId}`
  );

  const target = fbSession?.targets?.find((t: any) => t.id === targetId);

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/feedback-sessions/${sessionId}/responses`, {
        targetId,
        category,
        content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["my-feedback-sessions"] });
      toast.success("피드백이 제출되었습니다.");
      router.push(`/feedback/sessions/${sessionId}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isReady || isLoading) return <LoadingState rows={3} />;
  if (!fbSession || !target) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </button>
        <h1 className="text-2xl font-bold tracking-tight">피드백 작성</h1>
        <p className="text-muted-foreground mt-1">
          {target.user.name}님에게 피드백을 작성합니다.
        </p>
      </div>

      {fbSession.mode === "ANONYMOUS" && (
        <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-muted/50 border text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>익명 모드: 작성자 정보가 대상자에게 공개되지 않습니다.</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span>{target.user.name}</span>
            {target.user.position && (
              <Badge variant="outline" className="text-xs font-normal">{target.user.position}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">카테고리</Label>
            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    category === c.value
                      ? cn(c.color, "ring-2 ring-offset-2 ring-foreground/20")
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              피드백 내용 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="구체적인 상황과 행동, 그리고 그 영향에 대해 작성해주세요."
              className="min-h-[150px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}자
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => router.back()}>
              취소
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!content.trim() || mutation.isPending}
            >
              {mutation.isPending ? "제출 중..." : "피드백 제출"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
