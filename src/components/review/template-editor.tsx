"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, X, Loader2 } from "lucide-react";

export interface TemplateCategory {
  name: string;
  criteria: { name: string; description: string }[];
}

interface TemplateEditorProps {
  initialName?: string;
  initialCategories?: TemplateCategory[];
  onSubmit: (data: { name: string; categories: TemplateCategory[] }) => void;
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
  const [categories, setCategories] = useState<TemplateCategory[]>(
    initialCategories ?? [{ name: "", criteria: [{ name: "", description: "" }] }]
  );

  const addCategory = () => setCategories([...categories, { name: "", criteria: [{ name: "", description: "" }] }]);
  const removeCategory = (i: number) => setCategories(categories.filter((_, idx) => idx !== i));
  const addCriterion = (catIdx: number) => {
    const updated = [...categories];
    updated[catIdx].criteria.push({ name: "", description: "" });
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
                onChange={(e) => { const u = [...categories]; u[ci].name = e.target.value; setCategories(u); }}
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
          <CardContent className="space-y-2">
            {cat.criteria.map((c, cri) => (
              <div key={cri} className="flex gap-2">
                <Input
                  value={c.name}
                  onChange={(e) => { const u = [...categories]; u[ci].criteria[cri].name = e.target.value; setCategories(u); }}
                  placeholder="평가 항목명"
                  className="flex-1"
                />
                <Input
                  value={c.description}
                  onChange={(e) => { const u = [...categories]; u[ci].criteria[cri].description = e.target.value; setCategories(u); }}
                  placeholder="설명 (선택)"
                  className="flex-1"
                />
                {cat.criteria.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => {
                    const u = [...categories];
                    u[ci].criteria = u[ci].criteria.filter((_, i) => i !== cri);
                    setCategories(u);
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
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
