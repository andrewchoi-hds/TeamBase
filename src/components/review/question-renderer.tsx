"use client";

import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { QuestionType } from "@prisma/client";
import type { ResponseValue, ChoiceOption, RubricDefinition } from "@/lib/types/review-template";

const DEFAULT_LABELS: Record<number, string> = {
  1: "매우 부족",
  2: "부족",
  3: "보통",
  4: "우수",
  5: "탁월",
};

function RatingScale({
  value,
  onChange,
  label,
  hasError,
  rubric,
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
  hasError?: boolean;
  rubric?: RubricDefinition;
}) {
  const hasRubric = rubric && Object.values(rubric).some((v) => v);

  // 선택한 점수의 설명 텍스트
  const getDescription = (n: number) => {
    if (hasRubric && rubric[String(n) as keyof RubricDefinition]) {
      return rubric[String(n) as keyof RubricDefinition];
    }
    return DEFAULT_LABELS[n] ?? "";
  };

  return (
    <div className="space-y-2">
      {/* 점수 라벨 가이드 */}
      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5" style={{ width: `${5 * 2.25 + 0.25 * 4}rem` }}>
        <span>{DEFAULT_LABELS[1]}</span>
        <span>{DEFAULT_LABELS[5]}</span>
      </div>
      <div className="flex gap-1" role="radiogroup" aria-label={label || "평가 점수"}>
        {[1, 2, 3, 4, 5].map((n) => {
          const desc = getDescription(n);
          const btn = (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={n === value}
              aria-label={`${n}점: ${desc}`}
              onClick={() => onChange(n)}
              className={cn(
                "h-9 w-9 rounded-md border flex items-center justify-center text-sm font-medium transition-colors",
                n <= value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-accent",
                hasError && value === 0 && "border-destructive"
              )}
            >
              {n}
            </button>
          );

          return (
            <TooltipProvider key={n} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>{btn}</TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs font-medium">{n}점 — {DEFAULT_LABELS[n]}</p>
                  {hasRubric && rubric[String(n) as keyof RubricDefinition] && (
                    <p className="text-xs text-muted-foreground mt-0.5">{rubric[String(n) as keyof RubricDefinition]}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      {/* 선택한 점수의 설명 표시 */}
      {value > 0 && (
        <div className="text-xs pl-1 py-1.5 px-2.5 rounded-md bg-muted/60">
          <span className="font-medium text-foreground">{value}점 — {DEFAULT_LABELS[value]}</span>
          {hasRubric && rubric[String(value) as keyof RubricDefinition] && (
            <p className="text-muted-foreground mt-0.5">{rubric[String(value) as keyof RubricDefinition]}</p>
          )}
        </div>
      )}
    </div>
  );
}

interface QuestionRendererProps {
  criterionId: string;
  criterionName: string;
  questionType: QuestionType;
  options?: { choices?: ChoiceOption[]; rubric?: RubricDefinition } | null;
  value: ResponseValue;
  onChange: (value: ResponseValue) => void;
  hasError?: boolean;
}

export function QuestionRenderer({
  criterionId,
  criterionName,
  questionType,
  options,
  value,
  onChange,
  hasError,
}: QuestionRendererProps) {
  switch (questionType) {
    case "RATING":
      return (
        <div className="space-y-3">
          <RatingScale
            label={`${criterionName} 평가 점수`}
            value={value.rating ?? 0}
            hasError={hasError}
            rubric={options?.rubric}
            onChange={(rating) => onChange({ ...value, rating })}
          />
          <Textarea
            aria-label={`${criterionName} 코멘트`}
            placeholder="코멘트 (선택)"
            value={value.comment ?? ""}
            onChange={(e) => onChange({ ...value, comment: e.target.value })}
            rows={2}
          />
        </div>
      );

    case "TEXT":
      return (
        <Textarea
          aria-label={`${criterionName} 응답`}
          placeholder="답변을 입력해주세요"
          value={value.textValue ?? ""}
          onChange={(e) => onChange({ ...value, textValue: e.target.value })}
          rows={4}
          className={cn(hasError && "border-destructive")}
        />
      );

    case "SINGLE_CHOICE": {
      const choices = options?.choices ?? [];
      return (
        <RadioGroup
          value={value.selectedOptions?.[0] ?? ""}
          onValueChange={(v) => onChange({ ...value, selectedOptions: [v] })}
          className={cn("space-y-2", hasError && "[&>div]:border-destructive")}
        >
          {choices.map((choice) => (
            <div key={choice.value} className="flex items-center space-x-2">
              <RadioGroupItem value={choice.value} id={`${criterionId}-${choice.value}`} />
              <Label htmlFor={`${criterionId}-${choice.value}`} className="text-sm font-normal cursor-pointer">
                {choice.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    case "MULTI_CHOICE": {
      const choices = options?.choices ?? [];
      const selected = value.selectedOptions ?? [];
      return (
        <div className={cn("space-y-2", hasError && "[&>div]:border-destructive")}>
          {choices.map((choice) => (
            <div key={choice.value} className="flex items-center space-x-2">
              <Checkbox
                id={`${criterionId}-${choice.value}`}
                checked={selected.includes(choice.value)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...selected, choice.value]
                    : selected.filter((v) => v !== choice.value);
                  onChange({ ...value, selectedOptions: next });
                }}
              />
              <Label htmlFor={`${criterionId}-${choice.value}`} className="text-sm font-normal cursor-pointer">
                {choice.label}
              </Label>
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}
