"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/common/date-picker";
import { QuarterPicker, detectQuarter, getQuarterLabel } from "@/components/common/quarter-picker";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1, "목표를 입력하세요."),
  description: z.string().optional(),
  level: z.enum(["COMPANY", "TEAM", "INDIVIDUAL"]),
  startDate: z.string().min(1, "시작일을 선택하세요."),
  endDate: z.string().min(1, "종료일을 선택하세요."),
});

type FormData = z.infer<typeof schema>;

const levels = [
  { value: "INDIVIDUAL", label: "개인", desc: "개인 성과 목표" },
  { value: "TEAM", label: "팀", desc: "팀 단위 목표" },
  { value: "COMPANY", label: "전사", desc: "회사 전체 목표" },
] as const;

export default function NewObjectivePage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>("INDIVIDUAL");

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { level: "INDIVIDUAL" },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post("/objectives", data),
    onSuccess: () => {
      toast.success("목표가 생성되었습니다.");
      router.push("/objectives");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    if (date) {
      setValue("startDate", format(date, "yyyy-MM-dd"));
      if (endDate) {
        setSelectedQuarter(detectQuarter(date, endDate));
      }
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    if (date) {
      setValue("endDate", format(date, "yyyy-MM-dd"));
      if (startDate) {
        setSelectedQuarter(detectQuarter(startDate, date));
      }
    }
  };

  const handleQuarterSelect = (quarter: { key: string; startDate: Date; endDate: Date }) => {
    setSelectedQuarter(quarter.key);
    setStartDate(quarter.startDate);
    setEndDate(quarter.endDate);
    setValue("startDate", format(quarter.startDate, "yyyy-MM-dd"));
    setValue("endDate", format(quarter.endDate, "yyyy-MM-dd"));
  };

  const periodLabel = startDate ? getQuarterLabel(startDate) : null;

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
        <h1 className="text-2xl font-bold tracking-tight">새 목표</h1>
        <p className="text-muted-foreground mt-1">OKR 목표를 설정하고 기간을 지정합니다.</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-8">
        {/* Section 1: 기본 정보 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold">1</div>
            <h2 className="text-sm font-semibold uppercase tracking-wider">기본 정보</h2>
          </div>

          <div className="space-y-4 pl-8">
            <div className="space-y-2">
              <Label htmlFor="obj-title" className="text-sm font-medium">
                목표 <span className="text-muted-foreground font-normal">*</span>
              </Label>
              <Input
                id="obj-title"
                placeholder="예: 고객 만족도 90% 이상 달성"
                className="h-11"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="obj-description" className="text-sm font-medium">설명</Label>
              <Textarea
                id="obj-description"
                placeholder="목표에 대한 배경, 측정 방법, 기대 성과 등을 작성하세요."
                className="min-h-[100px] resize-none"
                {...register("description")}
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 2: 수준 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold">2</div>
            <h2 className="text-sm font-semibold uppercase tracking-wider">목표 수준</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 pl-8" role="radiogroup" aria-label="목표 수준">
            {levels.map((level) => (
              <button
                key={level.value}
                type="button"
                role="radio"
                aria-checked={selectedLevel === level.value}
                onClick={() => {
                  setSelectedLevel(level.value);
                  setValue("level", level.value);
                }}
                className={cn(
                  "flex flex-col items-start p-4 rounded-lg border transition-all duration-150 text-left",
                  "hover:border-foreground/30",
                  selectedLevel === level.value
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-background border-border"
                )}
              >
                <span className="text-sm font-semibold">{level.label}</span>
                <span className={cn(
                  "text-xs mt-0.5",
                  selectedLevel === level.value
                    ? "text-background/70"
                    : "text-muted-foreground"
                )}>
                  {level.desc}
                </span>
              </button>
            ))}
          </div>
        </section>

        <Separator />

        {/* Section 3: 기간 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold">3</div>
            <h2 className="text-sm font-semibold uppercase tracking-wider">기간 설정</h2>
          </div>

          <div className="pl-8 space-y-4">
            {/* Quarter picker */}
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-3">빠른 선택</p>
              <QuarterPicker
                selectedQuarter={selectedQuarter}
                onSelect={handleQuarterSelect}
              />
            </div>

            {/* Manual date pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="obj-start-date" className="text-sm font-medium">
                  시작일 <span className="text-muted-foreground font-normal">*</span>
                </Label>
                <DatePicker
                  id="obj-start-date"
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
                <Label htmlFor="obj-end-date" className="text-sm font-medium">
                  종료일 <span className="text-muted-foreground font-normal">*</span>
                </Label>
                <DatePicker
                  id="obj-end-date"
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
          </div>
        </section>

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-3 pl-8">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="px-8"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            목표 생성
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
