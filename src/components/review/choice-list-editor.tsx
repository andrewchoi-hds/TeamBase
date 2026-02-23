"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { ChoiceOption } from "@/lib/types/review-template";

interface ChoiceListEditorProps {
  choices: ChoiceOption[];
  onChange: (choices: ChoiceOption[]) => void;
}

export function ChoiceListEditor({ choices, onChange }: ChoiceListEditorProps) {
  const addChoice = () => {
    onChange([...choices, { label: "", value: `option_${choices.length + 1}` }]);
  };

  const removeChoice = (index: number) => {
    if (choices.length <= 2) return;
    onChange(choices.filter((_, i) => i !== index));
  };

  const updateLabel = (index: number, label: string) => {
    const updated = [...choices];
    updated[index] = { ...updated[index], label, value: label.toLowerCase().replace(/\s+/g, "_") || `option_${index + 1}` };
    onChange(updated);
  };

  return (
    <div className="space-y-2 pl-4 border-l-2 border-muted">
      <p className="text-xs text-muted-foreground">선택지 (최소 2개)</p>
      {choices.map((choice, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
          <Input
            value={choice.label}
            onChange={(e) => updateLabel(i, e.target.value)}
            placeholder={`선택지 ${i + 1}`}
            className="flex-1 h-8 text-sm"
          />
          {choices.length > 2 && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeChoice(i)}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addChoice}>
        <Plus className="mr-1 h-3 w-3" />선택지 추가
      </Button>
    </div>
  );
}
