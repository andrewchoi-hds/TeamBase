"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { LoadingState } from "@/components/common/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

export default function ObjectiveDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const [krOpen, setKrOpen] = useState(false);
  const [krTitle, setKrTitle] = useState("");
  const [krTarget, setKrTarget] = useState("");
  const [krUnit, setKrUnit] = useState("");

  const { data: objective, isLoading } = useQuery({
    queryKey: ["objective", params.id],
    queryFn: () => api.get<any>(`/objectives/${params.id}`),
  });

  const addKrMutation = useMutation({
    mutationFn: () => api.post(`/objectives/${params.id}/key-results`, { title: krTitle, targetValue: Number(krTarget), unit: krUnit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objective", params.id] });
      toast.success("핵심 결과가 추가되었습니다.");
      setKrOpen(false);
      setKrTitle("");
      setKrTarget("");
      setKrUnit("");
    },
  });

  const checkInMutation = useMutation({
    mutationFn: ({ krId, value, note }: { krId: string; value: number; note?: string }) =>
      api.post(`/objectives/${params.id}/key-results/${krId}/check-ins`, { value, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objective", params.id] });
      toast.success("체크인이 기록되었습니다.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/objectives/${params.id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objective", params.id] });
      toast.success("상태가 변경되었습니다.");
    },
  });

  if (isLoading) return <LoadingState rows={5} />;
  if (!objective) return null;

  return (
    <div>
      <PageHeader title={objective.title} description={objective.description}>
        <StatusBadge status={objective.status} />
        {objective.status === "DRAFT" && (
          <Button size="sm" onClick={() => statusMutation.mutate("ACTIVE")}>활성화</Button>
        )}
        {objective.status === "ACTIVE" && (
          <Button size="sm" variant="outline" onClick={() => statusMutation.mutate("COMPLETED")}>완료</Button>
        )}
      </PageHeader>

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">전체 달성률</span>
            <span className="text-2xl font-bold">{Math.round(objective.progress)}%</span>
          </div>
          <Progress value={objective.progress} className="h-3" />
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <span>{objective.owner.name}</span>
            <Badge variant="outline" className="text-xs">{objective.level === "INDIVIDUAL" ? "개인" : objective.level === "TEAM" ? "팀" : "전사"}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Results */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">핵심 결과 (Key Results)</h2>
        <Dialog open={krOpen} onOpenChange={setKrOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" />KR 추가</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>핵심 결과 추가</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>제목</Label>
                <Input value={krTitle} onChange={(e) => setKrTitle(e.target.value)} placeholder="예: NPS 점수 80 이상" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>목표값</Label>
                  <Input type="number" value={krTarget} onChange={(e) => setKrTarget(e.target.value)} placeholder="100" />
                </div>
                <div className="space-y-2">
                  <Label>단위</Label>
                  <Input value={krUnit} onChange={(e) => setKrUnit(e.target.value)} placeholder="점, %, 건" />
                </div>
              </div>
              <Button className="w-full" onClick={() => addKrMutation.mutate()} disabled={!krTitle || !krTarget || addKrMutation.isPending}>
                {addKrMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}추가
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {objective.keyResults?.map((kr: any) => (
          <Card key={kr.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{kr.title}</h3>
                <span className="text-lg font-bold">{Math.round(kr.progress)}%</span>
              </div>
              <Progress value={kr.progress} className="h-2 mb-2" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{kr.currentValue} / {kr.targetValue} {kr.unit}</span>
                <CheckInButton kr={kr} onCheckIn={(value) => checkInMutation.mutate({ krId: kr.id, value })} />
              </div>
              {kr.checkIns?.length > 0 && (
                <div className="mt-3 space-y-1">
                  {kr.checkIns.slice(0, 3).map((ci: any) => (
                    <div key={ci.id} className="flex justify-between text-xs text-muted-foreground">
                      <span>{ci.note || `체크인: ${ci.value}`}</span>
                      <span>{new Date(ci.createdAt).toLocaleDateString("ko-KR")}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CheckInButton({ kr, onCheckIn }: { kr: any; onCheckIn: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(kr.currentValue));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">체크인</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>체크인: {kr.title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>현재 값</Label>
            <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <Button className="w-full" onClick={() => { onCheckIn(Number(value)); setOpen(false); }}>기록</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
