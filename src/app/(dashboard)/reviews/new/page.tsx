"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "평가 주기 이름을 입력하세요."),
  description: z.string().optional(),
  startDate: z.string().min(1, "시작일을 선택하세요."),
  endDate: z.string().min(1, "종료일을 선택하세요."),
  templateId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewReviewCyclePage() {
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: templates } = useQuery({
    queryKey: ["review-templates"],
    queryFn: () => api.get<any[]>("/review-templates"),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post("/review-cycles", data),
    onSuccess: () => {
      toast.success("평가 주기가 생성되었습니다.");
      router.push("/reviews");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div>
      <PageHeader title="새 평가 주기" description="새로운 평가 주기를 생성합니다." />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>평가 주기 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input id="name" placeholder="2024년 상반기 평가" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea id="description" placeholder="평가 주기에 대한 설명" {...register("description")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">시작일 *</Label>
                <Input id="startDate" type="date" {...register("startDate")} />
                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">종료일 *</Label>
                <Input id="endDate" type="date" {...register("endDate")} />
                {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>평가 템플릿</Label>
              <Select onValueChange={(v) => setValue("templateId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="템플릿 선택 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                생성
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
