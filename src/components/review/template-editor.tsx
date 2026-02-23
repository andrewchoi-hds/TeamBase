"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, X, Loader2 } from "lucide-react";
import { CriterionEditor } from "./criterion-editor";
import type { CriterionFormData, TemplateCategoryFormData } from "@/lib/types/review-template";

// 하위호환: 기존 인터페이스도 export 유지
export interface TemplateCategory {
  name: string;
  criteria: CriterionFormData[];
}

function defaultCriterion(): CriterionFormData {
  return { name: "", description: "", questionType: "RATING", isRequired: true };
}

interface TemplateEditorProps {
  initialName?: string;
  initialCategories?: TemplateCategoryFormData[];
  onSubmit: (data: { name: string; categories: TemplateCategoryFormData[] }) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function TemplateEditor({
  initialName = "",
  initialCategories,
  onSubmit,
  isSubmitting = false,
  submitLabel = "생성",
}: TemplateEditorProps) {
  const [name, setName] = useState(initialName);
  const [categories, setCategories] = useState<TemplateCategoryFormData[]>(
    initialCategories ?? [{ name: "", criteria: [defaultCriterion()] }]
  );

  const addCategory = () => setCategories([...categories, { name: "", criteria: [defaultCriterion()] }]);
  const removeCategory = (i: number) => setCategories(categories.filter((_, idx) => idx !== i));

  const addCriterion = (catIdx: number) => {
    const updated = [...categories];
    updated[catIdx] = {
      ...updated[catIdx],
      criteria: [...updated[catIdx].criteria, defaultCriterion()],
    };
    setCategories(updated);
  };

  const updateCriterion = (catIdx: number, criIdx: number, criterion: CriterionFormData) => {
    const updated = [...categories];
    updated[catIdx] = {
      ...updated[catIdx],
      criteria: updated[catIdx].criteria.map((c, i) => (i === criIdx ? criterion : c)),
    };
    setCategories(updated);
  };

  const removeCriterion = (catIdx: number, criIdx: number) => {
    const updated = [...categories];
    updated[catIdx] = {
      ...updated[catIdx],
      criteria: updated[catIdx].criteria.filter((_, i) => i !== criIdx),
    };
    setCategories(updated);
  };

  const moveCriterion = (catIdx: number, from: number, to: number) => {
    if (to < 0 || to >= categories[catIdx].criteria.length) return;
    const updated = [...categories];
    const criteria = [...updated[catIdx].criteria];
    [criteria[from], criteria[to]] = [criteria[to], criteria[from]];
    updated[catIdx] = { ...updated[catIdx], criteria };
    setCategories(updated);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>템플릿 이름</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 분기별 역량 평가" />
      </div>
      {categories.map((cat, ci) => (
        <Card key={ci}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Input
                value={cat.name}
                onChange={(e) => {
                  const u = [...categories];
                  u[ci] = { ...u[ci], name: e.target.value };
                  setCategories(u);
                }}
                placeholder="카테고리명 (예: 업무 역량)"
                className="font-medium"
              />
              {categories.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeCategory(ci)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {cat.criteria.map((criterion, cri) => (
              <CriterionEditor
                key={cri}
                criterion={criterion}
                onChange={(updated) => updateCriterion(ci, cri, updated)}
                onDelete={() => removeCriterion(ci, cri)}
                onMoveUp={cri > 0 ? () => moveCriterion(ci, cri, cri - 1) : undefined}
                onMoveDown={cri < cat.criteria.length - 1 ? () => moveCriterion(ci, cri, cri + 1) : undefined}
                canDelete={cat.criteria.length > 1}
              />
            ))}
            <Button variant="outline" size="sm" onClick={() => addCriterion(ci)}>
              <Plus className="mr-1 h-3 w-3" />항목 추가
            </Button>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={addCategory}>
        <Plus className="mr-2 h-4 w-4" />카테고리 추가
      </Button>
      <Button
        className="w-full"
        onClick={() => onSubmit({ name, categories })}
        disabled={isSubmitting || !name}
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
}
