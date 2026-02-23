import type { QuestionType } from "@prisma/client";

export const QUESTION_TYPES = {
  RATING: { label: "평점 (1-5)", icon: "Star" },
  TEXT: { label: "서술형", icon: "AlignLeft" },
  SINGLE_CHOICE: { label: "단일 선택", icon: "CircleDot" },
  MULTI_CHOICE: { label: "복수 선택", icon: "CheckSquare" },
} as const;

export interface ChoiceOption {
  label: string;
  value: string;
}

export interface CriterionFormData {
  name: string;
  description: string;
  questionType: QuestionType;
  isRequired: boolean;
  options?: { choices: ChoiceOption[] };
}

export interface TemplateCategoryFormData {
  name: string;
  criteria: CriterionFormData[];
}

export type ResponseValue = {
  rating?: number;
  comment?: string;
  textValue?: string;
  selectedOptions?: string[];
};

export function validateResponse(
  questionType: QuestionType,
  isRequired: boolean,
  value: ResponseValue | undefined
): boolean {
  if (!isRequired) return true;
  if (!value) return false;

  switch (questionType) {
    case "RATING":
      return (value.rating ?? 0) > 0;
    case "TEXT":
      return (value.textValue ?? "").trim().length > 0;
    case "SINGLE_CHOICE":
      return (value.selectedOptions ?? []).length === 1;
    case "MULTI_CHOICE":
      return (value.selectedOptions ?? []).length > 0;
    default:
      return false;
  }
}
