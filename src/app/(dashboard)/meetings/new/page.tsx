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
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  title: z.string().min(1, "제목을 입력하세요."),
  participantId: z.string().min(1, "참여자를 선택하세요."),
  scheduledAt: z.string().min(1, "일시를 선택하세요."),
  duration: z.number().min(15).max(120),
  agenda: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewMeetingPage() {
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { duration: 30 },
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<any[]>("/users"),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post("/meetings", data),
    onSuccess: () => {
      toast.success("미팅이 생성되었습니다.");
      router.push("/meetings");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="새 미팅" description="1:1 미팅을 예약합니다." />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input placeholder="주간 1:1" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>참여자 *</Label>
              <Select onValueChange={(v) => setValue("participantId", v)}>
                <SelectTrigger><SelectValue placeholder="참여자 선택" /></SelectTrigger>
                <SelectContent>
                  {users?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.participantId && <p className="text-sm text-destructive">{errors.participantId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>일시 *</Label>
                <Input type="datetime-local" {...register("scheduledAt")} />
                {errors.scheduledAt && <p className="text-sm text-destructive">{errors.scheduledAt.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>소요 시간 (분)</Label>
                <Input type="number" min={15} max={120} {...register("duration", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>어젠다</Label>
              <Textarea placeholder="미팅 어젠다를 작성하세요." {...register("agenda")} />
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
