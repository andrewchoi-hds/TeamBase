"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, FileText, X, Loader2 } from "lucide-react";

export default function ReviewTemplatesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [categories, setCategories] = useState([{ name: "", criteria: [{ name: "", description: "" }] }]);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["review-templates"],
    queryFn: () => api.get<any[]>("/review-templates"),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post("/review-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-templates"] });
      toast.success("템플릿이 생성되었습니다.");
      setOpen(false);
      setName("");
      setCategories([{ name: "", criteria: [{ name: "", description: "" }] }]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addCategory = () => setCategories([...categories, { name: "", criteria: [{ name: "", description: "" }] }]);
  const removeCategory = (i: number) => setCategories(categories.filter((_, idx) => idx !== i));
  const addCriterion = (catIdx: number) => {
    const updated = [...categories];
    updated[catIdx].criteria.push({ name: "", description: "" });
    setCategories(updated);
  };

  return (
    <div>
      <PageHeader title="평가 템플릿" description="평가 항목 템플릿을 관리합니다.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />새 템플릿</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 평가 템플릿</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>템플릿 이름</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 분기별 역량 평가" />
              </div>
              {categories.map((cat, ci) => (
                <Card key={ci}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Input value={cat.name} onChange={(e) => { const u = [...categories]; u[ci].name = e.target.value; setCategories(u); }} placeholder="카테고리명 (예: 업무 역량)" className="font-medium" />
                      {categories.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeCategory(ci)}><X className="h-4 w-4" /></Button>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {cat.criteria.map((c, cri) => (
                      <div key={cri} className="flex gap-2">
                        <Input value={c.name} onChange={(e) => { const u = [...categories]; u[ci].criteria[cri].name = e.target.value; setCategories(u); }} placeholder="평가 항목명" className="flex-1" />
                        <Input value={c.description} onChange={(e) => { const u = [...categories]; u[ci].criteria[cri].description = e.target.value; setCategories(u); }} placeholder="설명 (선택)" className="flex-1" />
                        {cat.criteria.length > 1 && <Button variant="ghost" size="icon" onClick={() => { const u = [...categories]; u[ci].criteria = u[ci].criteria.filter((_, i) => i !== cri); setCategories(u); }}><X className="h-4 w-4" /></Button>}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addCriterion(ci)}><Plus className="mr-1 h-3 w-3" />항목 추가</Button>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" onClick={addCategory}><Plus className="mr-2 h-4 w-4" />카테고리 추가</Button>
              <Button className="w-full" onClick={() => mutation.mutate({ name, categories })} disabled={mutation.isPending || !name}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}생성
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? <LoadingState /> : !templates?.length ? (
        <EmptyState icon={<FileText className="h-12 w-12" />} title="템플릿이 없습니다" description="평가 항목 템플릿을 만들어보세요." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t: any) => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle className="text-lg">{t.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {t.categories?.map((cat: any) => (
                  <div key={cat.id} className="mb-2">
                    <p className="text-sm font-medium">{cat.name}</p>
                    <ul className="text-xs text-muted-foreground ml-3">
                      {cat.criteria?.map((c: any) => <li key={c.id}>- {c.name}</li>)}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
