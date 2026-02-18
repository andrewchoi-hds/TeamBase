"use client";

import { useState, useEffect, use } from "react";
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
import { toast } from "sonner";
import { Loader2, Save, Send } from "lucide-react";
import { cn } from "@/lib/utils";

function RatingScale({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            "h-9 w-9 rounded-md border flex items-center justify-center text-sm font-medium transition-colors",
            n <= value
              ? "bg-primary text-primary-foreground border-primary"
              : "hover:bg-accent"
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function WriteReviewPage({ params }: { params: Promise<{ cycleId: string; targetId: string }> }) {
  const { cycleId, targetId } = use(params);
  const router = useRouter();
  const { saveDraft, getDraft, removeDraft } = useReviewStore();

  const { data: cycle, isLoading } = useQuery({
    queryKey: ["review-cycle", cycleId],
    queryFn: () => api.get<any>(`/review-cycles/${cycleId}`),
  });

  const assignment = cycle?.assignments?.find(
    (a: any) => a.target.id === targetId
  );

  const [responses, setResponses] = useState<Record<string, { rating: number; comment: string }>>({});
  const [overallComment, setOverallComment] = useState("");
  const [reviewId, setReviewId] = useState<string | null>(null);

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!assignment) return;
      const responseArray = Object.entries(responses).map(([criterionId, r]) => ({
        criterionId,
        rating: r.rating,
        comment: r.comment,
      }));

      if (reviewId) {
        return api.patch(`/reviews/${reviewId}`, { overallComment, responses: responseArray });
      }

      // Create new review via assignment
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

  const submitMutation = useMutation({
    mutationFn: async () => {
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
    onError: (e: Error) => toast.error(e.message),
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
        {categories.map((category: any) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="text-lg">{category.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {category.criteria.map((criterion: any) => (
                <div key={criterion.id} className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">{criterion.name}</Label>
                    {criterion.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{criterion.description}</p>
                    )}
                  </div>
                  <RatingScale
                    value={responses[criterion.id]?.rating ?? 0}
                    onChange={(rating) =>
                      setResponses((prev) => ({
                        ...prev,
                        [criterion.id]: { ...prev[criterion.id], rating, comment: prev[criterion.id]?.comment ?? "" },
                      }))
                    }
                  />
                  <Textarea
                    placeholder="코멘트 (선택)"
                    value={responses[criterion.id]?.comment ?? ""}
                    onChange={(e) =>
                      setResponses((prev) => ({
                        ...prev,
                        [criterion.id]: { ...prev[criterion.id], rating: prev[criterion.id]?.rating ?? 0, comment: e.target.value },
                      }))
                    }
                    rows={2}
                  />
                </div>
              ))}
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
              placeholder="전반적인 평가 의견을 작성해주세요."
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
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
