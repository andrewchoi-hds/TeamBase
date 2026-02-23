"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useReviewStore } from "@/stores/review-store";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { DevelopmentContextPanel } from "@/components/review/development-context-panel";
import { QuestionRenderer } from "@/components/review/question-renderer";
import { validateResponse, QUESTION_TYPES, type ResponseValue } from "@/lib/types/review-template";
import type { QuestionType } from "@prisma/client";

export default function WriteReviewPage({ params }: { params: Promise<{ cycleId: string; targetId: string }> }) {
  const { cycleId, targetId } = use(params);
  const router = useRouter();
  const { saveDraft, getDraft, removeDraft } = useReviewStore();
  const criterionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data: cycle, isLoading } = useQuery({
    queryKey: ["review-cycle", cycleId],
    queryFn: () => api.get<any>(`/review-cycles/${cycleId}`),
  });

  const assignment = cycle?.assignments?.find(
    (a: any) => a.target.id === targetId
  );

  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
  const [overallComment, setOverallComment] = useState("");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [invalidCriteria, setInvalidCriteria] = useState<Set<string>>(new Set());

  // Load draft
  useEffect(() => {
    if (assignment) {
      const draft = getDraft(assignment.id);
      if (draft) {
        setResponses(draft.responses);
        setOverallComment(draft.overallComment);
      }
      if (assignment.review?.id) {
        setReviewId(assignment.review.id);
      }
    }
  }, [assignment, getDraft]);

  const buildResponseArray = useCallback(() => {
    const categories = cycle?.template?.categories ?? [];
    return Object.entries(responses).map(([criterionId, r]) => {
      // Find the criterion to get questionType
      let questionType: QuestionType = "RATING";
      for (const cat of categories) {
        const found = cat.criteria.find((c: any) => c.id === criterionId);
        if (found) {
          questionType = found.questionType ?? "RATING";
          break;
        }
      }
      return {
        criterionId,
        rating: questionType === "RATING" ? (r.rating ?? null) : null,
        comment: r.comment || null,
        textValue: r.textValue || null,
        selectedOptions: r.selectedOptions?.length ? r.selectedOptions : null,
      };
    });
  }, [responses, cycle]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!assignment) return;
      const responseArray = buildResponseArray();

      if (reviewId) {
        return api.patch(`/reviews/${reviewId}`, { overallComment, responses: responseArray });
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: assignment.id,
          cycleId: cycleId,
          targetId: targetId,
          overallComment,
          responses: responseArray,
        }),
      });
      const data = await res.json();
      setReviewId(data.id);
      return data;
    },
    onSuccess: () => {
      if (assignment) saveDraft(assignment.id, { responses, overallComment });
      toast.success("임시 저장되었습니다.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // 자동 저장 (디바운스 3초)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInteracted = useRef(false);

  useEffect(() => {
    if (!assignment || !hasInteracted.current) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft(assignment.id, { responses, overallComment });
    }, 3000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [responses, overallComment, assignment, saveDraft]);

  // 유형별 검증
  const validateAllResponses = useCallback((): boolean => {
    const categories = cycle?.template?.categories ?? [];
    const missing: string[] = [];

    for (const category of categories) {
      for (const criterion of category.criteria) {
        const questionType: QuestionType = criterion.questionType ?? "RATING";
        const isRequired: boolean = criterion.isRequired ?? true;
        const value = responses[criterion.id];

        if (!validateResponse(questionType, isRequired, value)) {
          missing.push(criterion.id);
        }
      }
    }

    if (missing.length > 0) {
      setInvalidCriteria(new Set(missing));
      toast.error(`${missing.length}개 필수 항목을 완성해주세요.`);
      const firstMissing = missing[0];
      const el = criterionRefs.current[firstMissing];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }

    setInvalidCriteria(new Set());
    return true;
  }, [cycle, responses]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!validateAllResponses()) {
        throw new Error("필수 항목을 모두 완성해주세요.");
      }

      if (!reviewId) {
        await saveMutation.mutateAsync();
      }
      if (reviewId) {
        return api.post(`/reviews/${reviewId}/submit`);
      }
    },
    onSuccess: () => {
      if (assignment) removeDraft(assignment.id);
      toast.success("평가가 제출되었습니다.");
      router.push(`/reviews/${cycleId}`);
    },
    onError: (e: Error) => {
      if (e.message !== "필수 항목을 모두 완성해주세요.") {
        toast.error(e.message);
      }
    },
  });

  if (isLoading) return <LoadingState rows={5} />;
  if (!cycle || !assignment) return null;

  const categories = cycle.template?.categories ?? [];

  return (
    <div>
      <PageHeader
        title={`${assignment.target.name} 평가 작성`}
        description={`${cycle.name} - ${assignment.target.position ?? ""}`}
      />

      <div className="max-w-3xl space-y-6">
        <DevelopmentContextPanel targetUserId={targetId} defaultExpanded />

        {categories.map((category: any) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="text-lg">{category.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {category.criteria.map((criterion: any) => {
                const hasError = invalidCriteria.has(criterion.id);
                const questionType: QuestionType = criterion.questionType ?? "RATING";
                return (
                  <div
                    key={criterion.id}
                    ref={(el) => { criterionRefs.current[criterion.id] = el; }}
                    className={cn(
                      "space-y-3 p-3 -mx-3 rounded-lg transition-colors",
                      hasError && "bg-destructive/5 ring-1 ring-destructive/20"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">
                          {criterion.name}
                          {!(criterion.isRequired ?? true) && (
                            <span className="text-muted-foreground font-normal ml-1">(선택)</span>
                          )}
                        </Label>
                        {criterion.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{criterion.description}</p>
                        )}
                        {hasError && (
                          <p className="text-xs text-destructive mt-1">이 항목을 완성해주세요</p>
                        )}
                      </div>
                      {questionType !== "RATING" && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {QUESTION_TYPES[questionType]?.label}
                        </Badge>
                      )}
                    </div>
                    <QuestionRenderer
                      criterionId={criterion.id}
                      criterionName={criterion.name}
                      questionType={questionType}
                      options={criterion.options}
                      value={responses[criterion.id] ?? {}}
                      hasError={hasError}
                      onChange={(val) => {
                        hasInteracted.current = true;
                        setResponses((prev) => ({ ...prev, [criterion.id]: val }));
                        setInvalidCriteria((prev) => {
                          const next = new Set(prev);
                          next.delete(criterion.id);
                          return next;
                        });
                      }}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {/* Overall Comment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">종합 의견</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="overall-comment"
              aria-label="종합 의견"
              placeholder="전반적인 평가 의견을 작성해주세요."
              value={overallComment}
              onChange={(e) => { hasInteracted.current = true; setOverallComment(e.target.value); }}
              rows={4}
            />
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            임시 저장
          </Button>
          <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            제출
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>취소</Button>
        </div>
      </div>
    </div>
  );
}
