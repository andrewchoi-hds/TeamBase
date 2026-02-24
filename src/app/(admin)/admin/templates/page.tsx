"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { TemplateEditor } from "@/components/review/template-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, FileText, MoreVertical, Pencil, Copy, Trash2 } from "lucide-react";
import { QUESTION_TYPES } from "@/lib/types/review-template";

export default function ReviewTemplatesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["review-templates"],
    queryFn: () => api.get<any[]>("/review-templates"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/review-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-templates"] });
      toast.success("템플릿이 생성되었습니다.");
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/review-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-templates"] });
      toast.success("템플릿이 수정되었습니다.");
      setEditOpen(false);
      setEditTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/review-templates/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-templates"] });
      toast.success("템플릿이 복제되었습니다.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/review-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-templates"] });
      toast.success("템플릿이 삭제되었습니다.");
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleEdit = (template: any) => {
    setEditTarget(template);
    setEditOpen(true);
  };

  return (
    <div>
      <PageHeader title="평가 템플릿" description="평가 항목 템플릿을 관리합니다.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />새 템플릿</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 평가 템플릿</DialogTitle>
            </DialogHeader>
            <TemplateEditor
              onSubmit={(data) => createMutation.mutate(data)}
              isSubmitting={createMutation.isPending}
              submitLabel="생성"
            />

          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? <LoadingState /> : !templates?.length ? (
        <EmptyState icon={<FileText className="h-12 w-12" />} title="템플릿이 없습니다" description="평가 항목 템플릿을 만들어보세요." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t: any) => (
            <Card key={t.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-lg">{t.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(t)}>
                      <Pencil className="mr-2 h-4 w-4" />수정
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateMutation.mutate(t.id)}>
                      <Copy className="mr-2 h-4 w-4" />복제
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(t.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                {t.categories?.map((cat: any) => (
                  <div key={cat.id} className="mb-2">
                    <p className="text-sm font-medium">{cat.name}</p>
                    <ul className="text-xs text-muted-foreground ml-3">
                      {cat.criteria?.map((c: any) => (
                        <li key={c.id} className="flex items-center gap-1">
                          - {c.name}
                          {c.questionType && c.questionType !== "RATING" && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                              {QUESTION_TYPES[c.questionType as keyof typeof QUESTION_TYPES]?.label ?? c.questionType}
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>템플릿 수정</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <TemplateEditor
              initialName={editTarget.name}
              initialGuideline={editTarget.guideline ?? ""}
              initialCategories={editTarget.categories?.map((cat: any) => ({
                name: cat.name,
                weight: cat.weight ?? 1.0,
                criteria: cat.criteria?.map((c: any) => ({
                  name: c.name,
                  description: c.description ?? "",
                  questionType: c.questionType ?? "RATING",
                  isRequired: c.isRequired ?? true,
                  options: c.options ?? undefined,
                })) ?? [],
              }))}
              onSubmit={(data) => editMutation.mutate({ id: editTarget.id, data })}
              isSubmitting={editMutation.isPending}
              submitLabel="수정"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>템플릿 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
