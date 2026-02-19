"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "STRENGTH", label: "강점", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "IMPROVEMENT", label: "개선점", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "GENERAL", label: "일반", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
];

export function QuickFeedback() {
  const queryClient = useQueryClient();
  const [targetId, setTargetId] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [content, setContent] = useState("");

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<any[]>("/users"),
  });

  const mutation = useMutation({
    mutationFn: () => api.post("/feedback/identified", { targetId, category, content }),
    onSuccess: () => {
      toast.success("피드백이 전송되었습니다.");
      setTargetId("");
      setCategory("GENERAL");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-personal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSubmit = targetId && content.length >= 5;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          빠른 피드백
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={targetId} onValueChange={setTargetId}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="대상자 선택" />
          </SelectTrigger>
          <SelectContent>
            {users?.map((u: any) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1.5">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat.value}
              variant="secondary"
              className={cn(
                "cursor-pointer text-xs transition-opacity border-0",
                cat.color,
                category !== cat.value && "opacity-40"
              )}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="피드백을 작성해주세요 (최소 5자)"
          rows={3}
          className="resize-none"
        />

        <Button
          size="sm"
          className="w-full"
          disabled={!canSubmit || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-2 h-3.5 w-3.5" />}
          전송
        </Button>
      </CardContent>
    </Card>
  );
}
