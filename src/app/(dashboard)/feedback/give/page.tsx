"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_GUIDES: Record<string, string> = {
  STRENGTH: "잘하는 점이나 기여하는 부분을 구체적으로 적어주세요",
  IMPROVEMENT: "더 나아질 수 있는 점을 건설적으로 제안해주세요",
  GENERAL: "자유롭게 피드백을 작성해주세요",
};

const MIN_LENGTH = 5;

const schema = z.object({
  targetId: z.string().min(1, "대상자를 선택하세요."),
  category: z.enum(["STRENGTH", "IMPROVEMENT", "GENERAL"]),
  content: z.string().min(MIN_LENGTH, `최소 ${MIN_LENGTH}자 이상 작성해주세요.`),
});

type FormData = z.infer<typeof schema>;

export default function GiveFeedbackPage() {
  const router = useRouter();
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "GENERAL" },
  });

  const category = useWatch({ control, name: "category" }) ?? "GENERAL";
  const content = useWatch({ control, name: "content" }) ?? "";

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<any[]>("/users"),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post("/feedback/identified", data),
    onSuccess: () => {
      toast.success("피드백이 전송되었습니다.");
      router.push("/feedback/sent");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="피드백 작성" description="동료에게 기명 피드백을 보냅니다." />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fb-target">대상자 *</Label>
              <Select onValueChange={(v) => setValue("targetId", v)}>
                <SelectTrigger id="fb-target"><SelectValue placeholder="대상자 선택" /></SelectTrigger>
                <SelectContent>
                  {users?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.name} {u.position ? `(${u.position})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.targetId && <p className="text-sm text-destructive">{errors.targetId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb-category">카테고리</Label>
              <Select defaultValue="GENERAL" onValueChange={(v) => setValue("category", v as any)}>
                <SelectTrigger id="fb-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STRENGTH">강점</SelectItem>
                  <SelectItem value="IMPROVEMENT">개선점</SelectItem>
                  <SelectItem value="GENERAL">일반</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{CATEGORY_GUIDES[category]}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb-content">내용 *</Label>
              <Textarea id="fb-content" {...register("content")} placeholder={CATEGORY_GUIDES[category]} rows={6} />
              <div className="flex items-center justify-between">
                {errors.content ? (
                  <p className="text-sm text-destructive">{errors.content.message}</p>
                ) : (
                  <span />
                )}
                <span className={cn(
                  "text-xs",
                  content.length < MIN_LENGTH ? "text-muted-foreground" : "text-green-600 dark:text-green-400"
                )}>
                  {content.length}자
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}전송
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>취소</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
