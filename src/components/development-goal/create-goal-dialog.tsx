"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/common/date-picker";
import { toast } from "sonner";
import { Loader2, Target } from "lucide-react";

interface CreateGoalDialogProps {
  sourceType?: string;
  sourceCycleId?: string;
  feedbackIds?: { sessionResponseId?: string }[];
  defaultTitle?: string;
  trigger?: React.ReactNode;
  variant?: "default" | "icon";
  onCreated?: () => void;
}

export function CreateGoalDialog({
  sourceType = "SELF",
  sourceCycleId,
  feedbackIds,
  defaultTitle = "",
  trigger,
  variant = "default",
  onCreated,
}: CreateGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/development-goals", data),
    onSuccess: () => {
      toast.success("개선 목표가 생성되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["development-goals"] });
      queryClient.invalidateQueries({ queryKey: ["development-context"] });
      setOpen(false);
      resetForm();
      onCreated?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => {
    setTitle(defaultTitle);
    setDescription("");
    setTargetDate(undefined);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      sourceType,
      sourceCycleId,
      targetDate: targetDate ? targetDate.toISOString() : undefined,
      feedbackIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) { setTitle(defaultTitle); } }}>
      <DialogTrigger asChild>
        {trigger ?? (
          variant === "icon" ? (
            <Button variant="ghost" size="icon" className="h-7 w-7" title="개선 목표 설정">
              <Target className="h-3.5 w-3.5 text-orange-500" />
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <Target className="mr-2 h-4 w-4" />
              개선 목표 설정
            </Button>
          )
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>개선 목표 설정</DialogTitle>
          <DialogDescription>
            피드백을 기반으로 성장 목표를 설정하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-title">목표 제목 *</Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 비개발자와의 커뮤니케이션 개선"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-description">상세 설명</Label>
            <Textarea
              id="goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="구체적인 실행 계획을 작성해주세요."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>목표 달성일</Label>
            <DatePicker
              value={targetDate}
              onChange={setTargetDate}
              placeholder="달성 목표일 선택"
              fromDate={new Date()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
