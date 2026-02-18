"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Building2, Users, Loader2 } from "lucide-react";

export default function OrganizationPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");

  const { data: departments, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get<any[]>("/departments"),
  });

  const mutation = useMutation({
    mutationFn: () => api.post("/departments", { name, parentId: parentId || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("부서가 추가되었습니다.");
      setOpen(false);
      setName("");
      setParentId("");
    },
  });

  return (
    <div>
      <PageHeader title="조직 관리" description="부서 구조를 관리합니다.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />부서 추가</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>새 부서</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>부서명</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 개발팀" /></div>
              <div className="space-y-2">
                <Label>상위 부서 (선택)</Label>
                <Select onValueChange={setParentId}>
                  <SelectTrigger><SelectValue placeholder="없음" /></SelectTrigger>
                  <SelectContent>
                    {departments?.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => mutation.mutate()} disabled={!name || mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}추가
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? <LoadingState /> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments?.map((dept: any) => (
            <Card key={dept.id}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">{dept.name}</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{dept._count?.users ?? 0}명</span>
                </div>
                {dept.parent && (
                  <Badge variant="outline" className="mt-2 text-xs">상위: {dept.parent.name}</Badge>
                )}
                {dept.children?.length > 0 && (
                  <div className="mt-2">
                    {dept.children.map((c: any) => (
                      <Badge key={c.id} variant="secondary" className="text-xs mr-1">{c.name}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
