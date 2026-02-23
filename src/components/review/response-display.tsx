"use client";

import { Badge } from "@/components/ui/badge";
import type { QuestionType } from "@prisma/client";

interface ResponseDisplayProps {
  questionType: QuestionType;
  rating: number | null;
  comment: string | null;
  textValue?: string | null;
  selectedOptions?: string[] | null;
  options?: { choices: { label: string; value: string }[] } | null;
}

export function ResponseDisplay({
  questionType,
  rating,
  comment,
  textValue,
  selectedOptions,
  options,
}: ResponseDisplayProps) {
  switch (questionType) {
    case "RATING":
      return (
        <div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={`h-2 w-4 rounded-sm ${n <= (rating ?? 0) ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
            <span className="text-sm font-medium w-6 text-right">{rating ?? "-"}</span>
          </div>
          {comment && (
            <p className="text-sm text-muted-foreground mt-1 pl-2 border-l-2">{comment}</p>
          )}
        </div>
      );

    case "TEXT":
      return (
        <p className="text-sm text-muted-foreground pl-2 border-l-2">
          {textValue || "-"}
        </p>
      );

    case "SINGLE_CHOICE": {
      const selected = selectedOptions?.[0];
      const choice = options?.choices?.find((c) => c.value === selected);
      return (
        <Badge variant="outline">{choice?.label ?? selected ?? "-"}</Badge>
      );
    }

    case "MULTI_CHOICE": {
      const choices = options?.choices ?? [];
      return (
        <div className="flex flex-wrap gap-1">
          {(selectedOptions ?? []).map((val) => {
            const choice = choices.find((c) => c.value === val);
            return (
              <Badge key={val} variant="outline">
                {choice?.label ?? val}
              </Badge>
            );
          })}
          {(!selectedOptions || selectedOptions.length === 0) && (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      );
    }

    default:
      return <span className="text-sm text-muted-foreground">-</span>;
  }
}
