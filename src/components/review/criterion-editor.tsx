"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, ChevronUp, ChevronDown, Star, AlignLeft, CircleDot, CheckSquare } from "lucide-react";
import { ChoiceListEditor } from "./choice-list-editor";
import { RubricEditor } from "./rubric-editor";
import { QUESTION_TYPES, type CriterionFormData } from "@/lib/types/review-template";
import type { QuestionType } from "@prisma/client";

const iconMap = {
  Star,
  AlignLeft,
  CircleDot,
  CheckSquare,
} as const;

interface CriterionEditorProps {
  criterion: CriterionFormData;
  onChange: (criterion: CriterionFormData) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canDelete: boolean;
}

export function CriterionEditor({
  criterion,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  canDelete,
}: CriterionEditorProps) {
  const isChoiceType = criterion.questionType === "SINGLE_CHOICE" || criterion.questionType === "MULTI_CHOICE";

  const handleTypeChange = (type: QuestionType) => {
    const updated: CriterionFormData = { ...criterion, questionType: type };
    if (type === "SINGLE_CHOICE" || type === "MULTI_CHOICE") {
      if (!updated.options?.choices?.length) {
        updated.options = { choices: [{ label: "", value: "option_1" }, { label: "", value: "option_2" }] };
      }
    } else {
      updated.options = undefined;
    }
    onChange(updated);
  };

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-card">
      <div className="flex gap-2 items-start">
        <div className="flex flex-col gap-1">
          {onMoveUp && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp}>
              <ChevronUp className="h-3 w-3" />
            </Button>
          )}
          {onMoveDown && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown}>
              <ChevronDown className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Input
            value={criterion.name}
            onChange={(e) => onChange({ ...criterion, name: e.target.value })}
            placeholder="평가 항목명"
          />
          <Input
            value={criterion.description}
            onChange={(e) => onChange({ ...criterion, description: e.target.value })}
            placeholder="설명 (선택)"
            className="text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={criterion.questionType} onValueChange={(v) => handleTypeChange(v as QuestionType)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(QUESTION_TYPES) as [QuestionType, { label: string; icon: string }][]).map(([key, { label, icon }]) => {
                const Icon = iconMap[icon as keyof typeof iconMap];
                return (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3" />
                      {label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {canDelete && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isChoiceType && criterion.options?.choices && (
        <ChoiceListEditor
          choices={criterion.options.choices}
          onChange={(choices) => onChange({ ...criterion, options: { ...criterion.options, choices } })}
        />
      )}

      {criterion.questionType === "RATING" && (
        <RubricEditor
          rubric={criterion.options?.rubric}
          onChange={(rubric) =>
            onChange({
              ...criterion,
              options: rubric ? { ...criterion.options, rubric } : criterion.options?.choices ? { choices: criterion.options.choices } : undefined,
            })
          }
        />
      )}

      <div className="flex items-center gap-2">
        <Switch
          id={`required-${criterion.name}`}
          checked={criterion.isRequired}
          onCheckedChange={(checked) => onChange({ ...criterion, isRequired: checked })}
        />
        <Label htmlFor={`required-${criterion.name}`} className="text-xs text-muted-foreground">필수 항목</Label>
      </div>
    </div>
  );
}
