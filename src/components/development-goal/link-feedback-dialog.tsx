"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Target } from "lucide-react";
import { CreateGoalDialog } from "./create-goal-dialog";

interface LinkFeedbackDialogProps {
  feedbackId: string;
  feedbackContent: string;
  trigger?: React.ReactNode;
}

export function LinkFeedbackDialog({
  feedbackId,
  feedbackContent,
  trigger,
}: LinkFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [mode, setMode] = useState<"link" | "create">("link");
  const queryClient = useQueryClient();

  const { data: goals } = useQuery({
    queryKey: ["development-goals", "active"],
    queryFn: () => api.get<any[]>("/development-goals?status=ACTIVE"),
    enabled: open,
  });

  const linkMutation = useMutation({
    mutationFn: () =>
      api.post(`/development-goals/${selectedGoalId}/link-feedback`, {
        sessionResponseId: feedbackId,
      }),
    onSuccess: () => {
      toast.success("피드백이 목표에 연결되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["development-goals"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const feedbackIds = [{ sessionResponseId: feedbackId }];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="text-xs">
            <Target className="mr-1 h-3 w-3" />
            개선 목표로 설정
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>개선 목표 연결</DialogTitle>
          <DialogDescription>
            이 피드백을 기존 목표에 연결하거나 새 목표를 만드세요.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-muted/50 p-3 mb-4">
          <p className="text-sm line-clamp-3">{feedbackContent}</p>
        </div>

        {goals && goals.length > 0 ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant={mode === "link" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("link")}
              >
                기존 목표에 연결
              </Button>
              <Button
                variant={mode === "create" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("create")}
              >
                새 목표 생성
              </Button>
            </div>

            {mode === "link" ? (
              <RadioGroup value={selectedGoalId} onValueChange={setSelectedGoalId}>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {goals.map((goal: any) => (
                    <div key={goal.id} className="flex items-center space-x-2 rounded-md border p-3">
                      <RadioGroupItem value={goal.id} id={`goal-${goal.id}`} />
                      <Label htmlFor={`goal-${goal.id}`} className="flex-1 cursor-pointer">
                        <span className="text-sm font-medium">{goal.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">{goal.progress}%</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            ) : (
              <CreateGoalDialog
                sourceType="FEEDBACK"
                feedbackIds={feedbackIds}
                trigger={
                  <Button variant="outline" className="w-full">
                    <Target className="mr-2 h-4 w-4" />
                    새 개선 목표 생성
                  </Button>
                }
                onCreated={() => setOpen(false)}
              />
            )}
          </div>
        ) : (
          <CreateGoalDialog
            sourceType="FEEDBACK"
            feedbackIds={feedbackIds}
            trigger={
              <Button variant="outline" className="w-full">
                <Target className="mr-2 h-4 w-4" />
                새 개선 목표 생성
              </Button>
            }
            onCreated={() => setOpen(false)}
          />
        )}

        {mode === "link" && goals && goals.length > 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button
              onClick={() => linkMutation.mutate()}
              disabled={!selectedGoalId || linkMutation.isPending}
            >
              {linkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              연결
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
