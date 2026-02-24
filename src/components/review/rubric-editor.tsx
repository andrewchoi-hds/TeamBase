"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { RubricDefinition } from "@/lib/types/review-template";

const RUBRIC_PLACEHOLDERS: Record<string, string> = {
  "1": "기대에 미달",
  "2": "부분적으로 충족",
  "3": "기대 수준 충족",
  "4": "기대 이상의 수준",
  "5": "탁월한 수준",
};

interface RubricEditorProps {
  rubric?: RubricDefinition;
  onChange: (rubric: RubricDefinition | undefined) => void;
}

export function RubricEditor({ rubric, onChange }: RubricEditorProps) {
  const [expanded, setExpanded] = useState(!!rubric && Object.values(rubric).some((v) => v));

  const handleChange = (score: keyof RubricDefinition, value: string) => {
    const updated = { ...(rubric ?? { "1": "", "2": "", "3": "", "4": "", "5": "" }), [score]: value };
    const allEmpty = Object.values(updated).every((v) => !v.trim());
    onChange(allEmpty ? undefined : updated);
  };

  if (!expanded) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground"
        onClick={() => setExpanded(true)}
      >
        <ChevronDown className="mr-1 h-3 w-3" />
        채점 기준 추가
      </Button>
    );
  }

  return (
    <div className="space-y-2 pl-2 border-l-2 border-muted">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground"
        onClick={() => setExpanded(false)}
      >
        <ChevronUp className="mr-1 h-3 w-3" />
        채점 기준 접기
      </Button>
      {(["1", "2", "3", "4", "5"] as const).map((score) => (
        <div key={score} className="flex items-center gap-2">
          <span className="text-xs font-medium w-8 text-center shrink-0">{score}점</span>
          <Input
            value={rubric?.[score] ?? ""}
            onChange={(e) => handleChange(score, e.target.value)}
            placeholder={RUBRIC_PLACEHOLDERS[score]}
            className="text-xs h-7"
          />
        </div>
      ))}
    </div>
  );
}
