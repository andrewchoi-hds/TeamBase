"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepWizardProps {
  steps: { title: string; description?: string }[];
  currentStep: number;
  onStepChange: (step: number) => void;
  children: React.ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  canProceed?: boolean;
}

export function StepWizard({
  steps,
  currentStep,
  onStepChange,
  children,
  onSubmit,
  submitLabel = "생성",
  isSubmitting = false,
  canProceed = true,
}: StepWizardProps) {
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <nav aria-label="진행 단계" className="flex items-center gap-2">
        {steps.map((step, i) => {
          const isComplete = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={i} className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => i < currentStep && onStepChange(i)}
                disabled={i > currentStep}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 transition-colors",
                  isComplete && "bg-primary text-primary-foreground cursor-pointer",
                  isCurrent && "bg-foreground text-background",
                  !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? <Check className="h-4 w-4" /> : i + 1}
              </button>
              <div className="hidden sm:block min-w-0">
                <p className={cn("text-sm font-medium truncate", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                  {step.title}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("flex-1 h-px", isComplete ? "bg-primary" : "bg-border")} />
              )}
            </div>
          );
        })}
      </nav>

      {/* Step Content */}
      <div className="min-h-[200px]">
        {children}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onStepChange(currentStep - 1)}
          disabled={currentStep === 0}
        >
          이전
        </Button>
        <div className="flex items-center gap-2">
          {isLast ? (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting || !canProceed}
            >
              {isSubmitting ? "처리 중..." : submitLabel}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => onStepChange(currentStep + 1)}
              disabled={!canProceed}
            >
              다음
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
