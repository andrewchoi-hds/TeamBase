"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Copy } from "lucide-react";

export default function RequestFeedbackPage() {
  const [targetId, setTargetId] = useState("");
  const [count, setCount] = useState(5);
  const [urls, setUrls] = useState<string[]>([]);

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<any[]>("/users"),
  });

  const mutation = useMutation({
    mutationFn: () => api.post<{ urls: string[] }>("/feedback/anonymous/request", { targetId, count }),
    onSuccess: (data: any) => {
      setUrls(data.urls);
      toast.success(`${data.count}개의 익명 피드백 링크가 생성되었습니다.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("링크가 복사되었습니다.");
  };

  return (
    <div>
      <PageHeader title="피드백 요청" description="익명 피드백 링크를 생성하여 배포합니다." />
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle>익명 피드백 링크 생성</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>대상자</Label>
              <Select onValueChange={setTargetId}>
                <SelectTrigger><SelectValue placeholder="피드백 대상자 선택" /></SelectTrigger>
                <SelectContent>
                  {users?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>링크 수</Label>
              <Input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} />
            </div>
            <Button onClick={() => mutation.mutate()} disabled={!targetId || mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              링크 생성
            </Button>
          </CardContent>
        </Card>

        {urls.length > 0 && (
          <Card>
            <CardHeader><CardTitle>생성된 링크</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">각 링크는 1회만 사용 가능합니다. 평가자에게 개별 전달하세요.</p>
              <div className="space-y-2">
                {urls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={url} readOnly className="text-xs" />
                    <Button variant="outline" size="icon" onClick={() => copyUrl(url)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
