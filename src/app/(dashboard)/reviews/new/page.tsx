"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api/client";
import { StepWizard } from "@/components/common/step-wizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/common/date-picker";
import { QuarterPicker, detectQuarter, getQuarterLabel } from "@/components/common/quarter-picker";
import { toast } from "sonner";
import { ArrowLeft, Calendar, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "평가 주기 이름을 입력하세요."),
  description: z.string().optional(),
  startDate: z.string().min(1, "시작일을 선택하세요."),
  endDate: z.string().min(1, "종료일을 선택하세요."),
  templateId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { title: "기본 정보", description: "이름과 설명" },
  { title: "기간 설정", description: "분기 또는 수동 날짜" },
  { title: "템플릿 선택", description: "평가 기준 템플릿" },
];

export default function NewReviewCyclePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors }, trigger } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const nameValue = watch("name");
  const startDateValue = watch("startDate");
  const endDateValue = watch("endDate");

  const { data: templates } = useQuery({
    queryKey: ["review-templates"],
    queryFn: () => api.get<any[]>("/review-templates"),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post("/review-cycles", data),
    onSuccess: () => {
      toast.success("평가 주기가 생성되었습니다.");
      router.push("/reviews");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    if (date) {
      setValue("startDate", format(date, "yyyy-MM-dd"));
      if (endDate) {
        const q = detectQuarter(date, endDate);
        setSelectedQuarter(q);
        maybeAutoName(date, endDate);
      }
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    if (date) {
      setValue("endDate", format(date, "yyyy-MM-dd"));
      if (startDate) {
        const q = detectQuarter(startDate, date);
        setSelectedQuarter(q);
        maybeAutoName(startDate, date);
      }
    }
  };

  const handleQuarterSelect = (quarter: { key: string; label: string; startDate: Date; endDate: Date }) => {
    setSelectedQuarter(quarter.key);
    setStartDate(quarter.startDate);
    setEndDate(quarter.endDate);
    setValue("startDate", format(quarter.startDate, "yyyy-MM-dd"));
    setValue("endDate", format(quarter.endDate, "yyyy-MM-dd"));

    const year = quarter.startDate.getFullYear();
    const autoName = `${year}년 ${quarter.label} 평가`;
    if (!nameValue || nameValue.match(/^\d{4}년.*평가$/)) {
      setValue("name", autoName);
    }
  };

  const maybeAutoName = (start: Date, _end: Date) => {
    if (nameValue && !nameValue.match(/^\d{4}년.*평가$/)) return;
    const label = getQuarterLabel(start);
    setValue("name", `${label} 평가`);
  };

  const periodLabel = startDate ? getQuarterLabel(startDate) : null;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!nameValue?.trim();
      case 1: return !!startDateValue && !!endDateValue;
      case 2: return true; // 템플릿 선택은 선택사항
      default: return false;
    }
  };

  const handleStepChange = async (step: number) => {
    if (step > currentStep) {
      // 현재 스텝의 필수 필드를 검증
      if (currentStep === 0) {
        const valid = await trigger("name");
        if (!valid) return;
      }
      if (currentStep === 1) {
        const valid = await trigger(["startDate", "endDate"]);
        if (!valid) return;
      }
    }
    setCurrentStep(step);
  };

  const onSubmit = handleSubmit((d) => mutation.mutate(d));

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </button>
        <h1 className="text-2xl font-bold tracking-tight">새 평가 주기</h1>
        <p className="text-muted-foreground mt-1">평가 주기를 생성하고 기간 및 템플릿을 설정합니다.</p>
      </div>

      <StepWizard
        steps={STEPS}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        onSubmit={onSubmit}
        submitLabel="평가 주기 생성"
        isSubmitting={mutation.isPending}
        canProceed={canProceed()}
      >
        {/* Step 1: 기본 정보 */}
        {currentStep === 0 && (
          <section className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cycle-name" className="text-sm font-medium">
                이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cycle-name"
                placeholder="예: 2026년 1분기 평가"
                className="h-11"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cycle-description" className="text-sm font-medium">설명</Label>
              <Textarea
                id="cycle-description"
                placeholder="이 평가 주기의 목적, 참여 대상, 특이사항 등을 기재하세요."
                className="min-h-[100px] resize-none"
                {...register("description")}
              />
            </div>
          </section>
        )}

        {/* Step 2: 기간 설정 */}
        {currentStep === 1 && (
          <section className="space-y-4">
            {/* Quarter picker */}
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-3">분기를 선택하면 이름과 기간이 자동 설정됩니다</p>
              <QuarterPicker
                selectedQuarter={selectedQuarter}
                onSelect={handleQuarterSelect}
              />
            </div>

            {/* Manual date pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cycle-start-date" className="text-sm font-medium">
                  시작일 <span className="text-destructive">*</span>
                </Label>
                <DatePicker
                  id="cycle-start-date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  placeholder="시작일 선택"
                  toDate={endDate}
                />
                {errors.startDate && (
                  <p className="text-sm text-destructive">{errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycle-end-date" className="text-sm font-medium">
                  종료일 <span className="text-destructive">*</span>
                </Label>
                <DatePicker
                  id="cycle-end-date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  placeholder="종료일 선택"
                  fromDate={startDate}
                />
                {errors.endDate && (
                  <p className="text-sm text-destructive">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* Period summary */}
            {startDate && endDate && (
              <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-muted/50 border border-border">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {format(startDate, "yyyy.M.d")} — {format(endDate, "yyyy.M.d")}
                  {periodLabel && (
                    <span className="ml-2 font-medium text-foreground">
                      ({periodLabel})
                    </span>
                  )}
                </span>
              </div>
            )}
          </section>
        )}

        {/* Step 3: 템플릿 선택 */}
        {currentStep === 2 && (
          <section className="space-y-3">
            {templates && templates.length > 0 ? (
              <>
                <p className="text-xs text-muted-foreground">
                  평가 기준이 사전 정의된 템플릿을 선택하세요. 선택하지 않아도 됩니다.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {templates.map((t: any) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setValue("templateId", watch("templateId") === t.id ? "" : t.id)}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border text-left transition-all duration-150",
                        "hover:border-foreground/30",
                        watch("templateId") === t.id
                          ? "bg-foreground text-background border-foreground shadow-sm"
                          : "bg-background border-border"
                      )}
                    >
                      <FileCheck className={cn(
                        "h-4 w-4 mt-0.5 shrink-0",
                        watch("templateId") === t.id ? "text-background/70" : "text-muted-foreground"
                      )} />
                      <div>
                        <span className="text-sm font-medium">{t.name}</span>
                        {t.description && (
                          <p className={cn(
                            "text-xs mt-0.5",
                            watch("templateId") === t.id ? "text-background/70" : "text-muted-foreground"
                          )}>
                            {t.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-6 text-center rounded-lg border border-dashed border-border">
                <p className="text-sm text-muted-foreground">등록된 템플릿이 없습니다</p>
                <p className="text-xs text-muted-foreground mt-1">템플릿 없이도 평가 주기를 생성할 수 있습니다</p>
              </div>
            )}
          </section>
        )}
      </StepWizard>
    </div>
  );
}
