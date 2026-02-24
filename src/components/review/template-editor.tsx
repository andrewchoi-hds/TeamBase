"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { CriterionEditor } from "./criterion-editor";
import { TEMPLATE_PRESETS } from "@/lib/constants/template-presets";
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
  initialGuideline?: string;
  onSubmit: (data: { name: string; guideline?: string; categories: TemplateCategoryFormData[] }) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function TemplateEditor({
  initialName = "",
  initialCategories,
  initialGuideline = "",
  onSubmit,
  isSubmitting = false,
  submitLabel = "생성",
}: TemplateEditorProps) {
  const [name, setName] = useState(initialName);
  const [guideline, setGuideline] = useState(initialGuideline);
  const [guidelineExpanded, setGuidelineExpanded] = useState(!!initialGuideline);
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(null);
  const [categories, setCategories] = useState<TemplateCategoryFormData[]>(
    initialCategories ?? [{ name: "", criteria: [defaultCriterion()] }]
  );

  const applyPreset = (presetId: string) => {
    const preset = TEMPLATE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setCategories(preset.categories);
    setPendingPresetId(null);
  };

  const handlePresetSelect = (presetId: string) => {
    const hasContent = categories.some((c) => c.name || c.criteria.some((cr) => cr.name));
    if (hasContent) {
      setPendingPresetId(presetId);
    } else {
      applyPreset(presetId);
    }
  };

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

      {/* 가이드라인 */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground px-0"
          onClick={() => setGuidelineExpanded(!guidelineExpanded)}
        >
          {guidelineExpanded ? <ChevronUp className="mr-1 h-3 w-3" /> : <ChevronDown className="mr-1 h-3 w-3" />}
          작성 가이드라인 {guideline ? "(작성됨)" : "(선택)"}
        </Button>
        {guidelineExpanded && (
          <Textarea
            value={guideline}
            onChange={(e) => setGuideline(e.target.value)}
            placeholder="평가 작성 시 참고할 가이드라인을 입력해주세요. 예: 구체적인 행동 사례를 중심으로 서술해주세요..."
            rows={3}
            className="text-sm"
          />
        )}
      </div>

      {/* 프리셋 선택 */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">프리셋 적용</Label>
        <Select onValueChange={handlePresetSelect}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="프리셋을 선택하면 카테고리가 자동 생성됩니다" />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATE_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                <span className="text-xs">{preset.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 프리셋 덮어쓰기 확인 */}
      <AlertDialog open={!!pendingPresetId} onOpenChange={(open) => !open && setPendingPresetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프리셋 적용</AlertDialogTitle>
            <AlertDialogDescription>
              기존에 작성한 카테고리가 있습니다. 프리셋을 적용하면 기존 내용이 교체됩니다. 계속하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingPresetId && applyPreset(pendingPresetId)}>
              적용
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {categories.map((cat, ci) => (
        <Card key={ci}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Input
                value={cat.name}
                onChange={(e) => {
                  const u = [...categories];
                  u[ci] = { ...u[ci], name: e.target.value };
                  setCategories(u);
                }}
                placeholder="카테고리명 (예: 업무 역량)"
                className="font-medium flex-1"
              />
              <div className="flex items-center gap-1 shrink-0">
                <Label className="text-[10px] text-muted-foreground">가중치</Label>
                <Input
                  type="number"
                  step={0.1}
                  min={0.1}
                  max={5}
                  value={cat.weight ?? 1.0}
                  onChange={(e) => {
                    const u = [...categories];
                    u[ci] = { ...u[ci], weight: parseFloat(e.target.value) || 1.0 };
                    setCategories(u);
                  }}
                  className="w-16 h-8 text-xs text-center"
                />
              </div>
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
        onClick={() => onSubmit({ name, guideline: guideline || undefined, categories })}
        disabled={isSubmitting || !name}
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
}
