"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
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
  title: z.string().min(1, "목표를 입력하세요."),
  description: z.string().optional(),
  level: z.enum(["COMPANY", "TEAM", "INDIVIDUAL"]),
  startDate: z.string().min(1, "시작일을 선택하세요."),
  endDate: z.string().min(1, "종료일을 선택하세요."),
});

type FormData = z.infer<typeof schema>;

export default function NewObjectivePage() {
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { level: "INDIVIDUAL" },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post("/objectives", data),
    onSuccess: () => {
      toast.success("목표가 생성되었습니다.");
      router.push("/objectives");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="새 목표" description="새로운 OKR 목표를 설정합니다." />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label>목표 *</Label>
              <Input placeholder="예: 고객 만족도 90% 이상 달성" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea placeholder="목표에 대한 상세 설명" {...register("description")} />
            </div>
            <div className="space-y-2">
              <Label>수준</Label>
              <Select defaultValue="INDIVIDUAL" onValueChange={(v) => setValue("level", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">개인</SelectItem>
                  <SelectItem value="TEAM">팀</SelectItem>
                  <SelectItem value="COMPANY">전사</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>시작일 *</Label>
                <Input type="date" {...register("startDate")} />
                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>종료일 *</Label>
                <Input type="date" {...register("endDate")} />
                {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}생성
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>취소</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
