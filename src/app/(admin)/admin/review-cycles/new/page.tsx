"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api/client";
import { StepWizard } from "@/components/common/step-wizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePicker } from "@/components/common/date-picker";
import { QuarterPicker, detectQuarter, getQuarterLabel } from "@/components/common/quarter-picker";
import { toast } from "sonner";
import { ArrowLeft, Calendar, ChevronDown, Eye, FileCheck, Star, AlignLeft, CircleDot, CheckSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QuestionRenderer } from "@/components/review/question-renderer";
import type { ResponseValue } from "@/lib/types/review-template";
import {
  STRATEGIES,
  PRESETS,
  generateAssignments,
  getAssignmentBreakdown,
  type Strategy,
  type AssignmentUser,
} from "@/lib/utils/assignment-generator";

const schema = z.object({
  name: z.string().min(1, "평가 주기 이름을 입력하세요."),
  description: z.string().optional(),
  startDate: z.string().min(1, "시작일을 선택하세요."),
  endDate: z.string().min(1, "종료일을 선택하세요."),
  templateId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const REVIEW_TYPE_LABELS: Record<string, string> = {
  SELF: "자기평가",
  PEER: "동료평가",
  UPWARD: "상향평가",
  DOWNWARD: "하향평가",
};

const STEPS = [
  { title: "기본 정보", description: "이름과 설명" },
  { title: "기간 설정", description: "분기 또는 수동 날짜" },
  { title: "템플릿", description: "평가 기준 템플릿" },
  { title: "배정 규칙", description: "배정 전략 선택" },
  { title: "미리보기", description: "대상자 선택 + 확인" },
];

export default function NewReviewCyclePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);

  // Step 4: 배정 규칙
  const [selectedStrategies, setSelectedStrategies] = useState<Set<Strategy>>(new Set());
  const [skipAssignment, setSkipAssignment] = useState(false);

  // Step 3: 문항 체험 모드
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [previewResponses, setPreviewResponses] = useState<Record<string, ResponseValue>>({});

  // Step 5: 대상자 선택
  const [targetScope, setTargetScope] = useState<"all" | "manual">("all");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

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

  // Step 5에서 사용자 목록 가져오기
  const { data: users } = useQuery({
    queryKey: ["users-for-assignment"],
    queryFn: () => api.get<AssignmentUser[]>("/users"),
    enabled: currentStep >= 4 && !skipAssignment,
  });

  const allUsers = useMemo(() => users ?? [], [users]);

  const selectedUsers = useMemo(() => {
    if (targetScope === "all") return allUsers;
    return allUsers.filter((u) => selectedUserIds.has(u.id));
  }, [allUsers, targetScope, selectedUserIds]);

  // 미리보기 계산
  const previewAssignments = useMemo(() => {
    if (skipAssignment || selectedStrategies.size === 0 || selectedUsers.length === 0) return [];
    return generateAssignments(Array.from(selectedStrategies), selectedUsers, allUsers);
  }, [skipAssignment, selectedStrategies, selectedUsers, allUsers]);

  const previewBreakdown = useMemo(
    () => getAssignmentBreakdown(previewAssignments),
    [previewAssignments]
  );

  // 부서별 그룹핑
  const usersByDept = useMemo(() => {
    const map: Record<string, { name: string; users: AssignmentUser[] }> = {};
    for (const user of allUsers) {
      const deptId = user.departmentId || "none";
      const deptName = user.department?.name || "부서 미지정";
      if (!map[deptId]) map[deptId] = { name: deptName, users: [] };
      map[deptId].users.push(user);
    }
    return map;
  }, [allUsers]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: Record<string, unknown> = { ...data };
      if (!skipAssignment && selectedStrategies.size > 0) {
        payload.assignmentRules = {
          strategies: Array.from(selectedStrategies),
          targetUserIds: targetScope === "manual" ? Array.from(selectedUserIds) : undefined,
        };
      }
      return api.post("/review-cycles", payload);
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["review-cycles"] });
      const count = result?.assignmentCount ?? 0;
      if (count > 0) {
        toast.success(`평가 주기가 생성되고 ${count}건이 배정되었습니다.`);
      } else {
        toast.success("평가 주기가 생성되었습니다.");
      }
      router.push("/admin/review-cycles");
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

  const toggleStrategy = (strategy: Strategy) => {
    setSelectedStrategies((prev) => {
      const next = new Set(prev);
      if (next.has(strategy)) next.delete(strategy);
      else next.add(strategy);
      return next;
    });
    setSkipAssignment(false);
  };

  const applyPreset = (strategies: Strategy[]) => {
    setSelectedStrategies(new Set(strategies));
    setSkipAssignment(false);
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleDepartment = (deptId: string) => {
    const deptUsers = allUsers.filter((u) => (u.departmentId || "none") === deptId);
    const allSelected = deptUsers.every((u) => selectedUserIds.has(u.id));
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      for (const u of deptUsers) {
        if (allSelected) next.delete(u.id);
        else next.add(u.id);
      }
      return next;
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!nameValue?.trim();
      case 1: return !!startDateValue && !!endDateValue;
      case 2: return true;
      case 3: return skipAssignment || selectedStrategies.size > 0;
      case 4: return true;
      default: return false;
    }
  };

  const handleStepChange = async (step: number) => {
    if (step > currentStep) {
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
        <p className="text-muted-foreground mt-1">평가 주기를 생성하고 배정까지 한번에 설정합니다.</p>
      </div>

      <StepWizard
        steps={STEPS}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        onSubmit={onSubmit}
        submitLabel={
          skipAssignment || selectedStrategies.size === 0
            ? "평가 주기 생성"
            : `생성 + ${previewAssignments.length}건 배정`
        }
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
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-3">분기를 선택하면 이름과 기간이 자동 설정됩니다</p>
              <QuarterPicker
                selectedQuarter={selectedQuarter}
                onSelect={handleQuarterSelect}
              />
            </div>
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
                  {templates.map((t: any) => {
                    const isSelected = watch("templateId") === t.id;
                    const totalCriteria = t.categories?.reduce((sum: number, cat: any) => sum + (cat.criteria?.length ?? 0), 0) ?? 0;
                    const QUESTION_TYPE_ICON: Record<string, React.ReactNode> = {
                      RATING: <Star className="h-3 w-3" />,
                      TEXT: <AlignLeft className="h-3 w-3" />,
                      SINGLE_CHOICE: <CircleDot className="h-3 w-3" />,
                      MULTI_CHOICE: <CheckSquare className="h-3 w-3" />,
                    };
                    const QUESTION_TYPE_LABEL: Record<string, string> = {
                      RATING: "평점",
                      TEXT: "서술형",
                      SINGLE_CHOICE: "단일 선택",
                      MULTI_CHOICE: "복수 선택",
                    };

                    return (
                      <div key={t.id} className="space-y-0">
                        <button
                          type="button"
                          onClick={() => setValue("templateId", isSelected ? "" : t.id)}
                          className={cn(
                            "w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all duration-150",
                            "hover:border-foreground/30",
                            isSelected
                              ? "bg-foreground text-background border-foreground shadow-sm rounded-b-none"
                              : "bg-background border-border"
                          )}
                        >
                          <FileCheck className={cn(
                            "h-4 w-4 mt-0.5 shrink-0",
                            isSelected ? "text-background/70" : "text-muted-foreground"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">{t.name}</span>
                              <span className={cn(
                                "text-xs shrink-0",
                                isSelected ? "text-background/70" : "text-muted-foreground"
                              )}>
                                {t.categories?.length ?? 0}개 카테고리 · {totalCriteria}개 문항
                              </span>
                            </div>
                            {t.description && (
                              <p className={cn(
                                "text-xs mt-0.5",
                                isSelected ? "text-background/70" : "text-muted-foreground"
                              )}>
                                {t.description}
                              </p>
                            )}
                          </div>
                        </button>

                        {/* 선택된 템플릿 문항 미리보기 */}
                        {isSelected && t.categories?.length > 0 && (
                          <div className="border border-t-0 border-foreground rounded-b-lg bg-muted/30 p-3 space-y-2">
                            <div className="flex items-center justify-between px-1">
                              <p className="text-xs font-medium text-muted-foreground">문항 미리보기</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1.5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewResponses({});
                                  setPreviewTemplateId(t.id);
                                }}
                              >
                                <Eye className="h-3 w-3" />
                                미리 풀어보기
                              </Button>
                            </div>
                            {t.categories.map((cat: any) => (
                              <Collapsible key={cat.id} defaultOpen>
                                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 rounded-md bg-background border text-left text-sm font-medium hover:bg-accent/50 transition-colors group">
                                  <div className="flex items-center gap-2">
                                    <span>{cat.name}</span>
                                    {cat.weight != null && cat.weight !== 1 && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        가중치 {cat.weight}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{cat.criteria?.length ?? 0}개 문항</span>
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="mt-1 space-y-0.5 pl-1">
                                    {cat.criteria?.map((criterion: any, idx: number) => (
                                      <div
                                        key={criterion.id}
                                        className="flex items-start gap-2.5 px-3 py-2 rounded-md text-sm"
                                      >
                                        <span className="text-xs text-muted-foreground mt-0.5 w-5 shrink-0 text-right">{idx + 1}.</span>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-muted-foreground">
                                              {QUESTION_TYPE_ICON[criterion.questionType] ?? null}
                                            </span>
                                            <span className="font-medium">{criterion.name}</span>
                                            {criterion.isRequired && (
                                              <span className="text-destructive text-xs">*</span>
                                            )}
                                            <span className="text-[10px] text-muted-foreground">
                                              {QUESTION_TYPE_LABEL[criterion.questionType] ?? criterion.questionType}
                                            </span>
                                          </div>
                                          {criterion.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{criterion.description}</p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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

        {/* 템플릿 문항 체험 모드 Dialog */}
        {previewTemplateId && (() => {
          const t = templates?.find((tpl: any) => tpl.id === previewTemplateId);
          if (!t) return null;
          return (
            <Dialog open={!!previewTemplateId} onOpenChange={() => setPreviewTemplateId(null)}>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {t.name} — 문항 체험
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    평가자가 실제로 보게 될 화면입니다. 입력 내용은 저장되지 않습니다.
                  </p>
                </DialogHeader>
                <div className="space-y-6 pt-2">
                  {t.categories?.map((cat: any) => (
                    <div key={cat.id}>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                        <h3 className="text-sm font-semibold">{cat.name}</h3>
                        {cat.weight != null && cat.weight !== 1 && (
                          <Badge variant="outline" className="text-[10px]">가중치 {cat.weight}</Badge>
                        )}
                      </div>
                      <div className="space-y-5">
                        {cat.criteria?.map((criterion: any) => (
                          <div key={criterion.id} className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium">{criterion.name}</span>
                              {criterion.isRequired && (
                                <span className="text-destructive text-xs">*</span>
                              )}
                            </div>
                            {criterion.description && (
                              <p className="text-xs text-muted-foreground">{criterion.description}</p>
                            )}
                            <QuestionRenderer
                              criterionId={criterion.id}
                              criterionName={criterion.name}
                              questionType={criterion.questionType}
                              options={criterion.options}
                              value={previewResponses[criterion.id] ?? {}}
                              onChange={(val) =>
                                setPreviewResponses((prev) => ({ ...prev, [criterion.id]: val }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          );
        })()}

        {/* Step 4: 배정 규칙 선택 */}
        {currentStep === 3 && (
          <section className="space-y-5">
            {/* 프리셋 */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">빠른 선택</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((preset) => {
                  const isActive = !skipAssignment &&
                    preset.strategies.length === selectedStrategies.size &&
                    preset.strategies.every((s) => selectedStrategies.has(s));
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => applyPreset(preset.strategies)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-colors",
                        isActive
                          ? "bg-foreground text-background border-foreground"
                          : "hover:border-foreground/30"
                      )}
                    >
                      <p className="text-sm font-medium">{preset.label}</p>
                      <p className={cn("text-xs mt-0.5", isActive ? "text-background/70" : "text-muted-foreground")}>
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 개별 전략 */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">개별 전략 선택</p>
              <div className="space-y-2">
                {STRATEGIES.map((s) => (
                  <label
                    key={s.key}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      !skipAssignment && selectedStrategies.has(s.key)
                        ? "border-foreground/50 bg-muted/50"
                        : "hover:border-foreground/20"
                    )}
                  >
                    <Checkbox
                      checked={!skipAssignment && selectedStrategies.has(s.key)}
                      onCheckedChange={() => toggleStrategy(s.key)}
                    />
                    <div>
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 건너뛰기 */}
            <label className="flex items-center gap-2 p-3 rounded-lg border border-dashed cursor-pointer hover:border-foreground/20">
              <Checkbox
                checked={skipAssignment}
                onCheckedChange={(checked) => {
                  setSkipAssignment(!!checked);
                  if (checked) setSelectedStrategies(new Set());
                }}
              />
              <div>
                <p className="text-sm font-medium">나중에 배정</p>
                <p className="text-xs text-muted-foreground">주기만 생성하고 배정은 나중에 합니다</p>
              </div>
            </label>
          </section>
        )}

        {/* Step 5: 대상자 선택 + 미리보기 */}
        {currentStep === 4 && (
          <section className="space-y-4">
            {skipAssignment ? (
              <div className="py-8 text-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">배정 없이 평가 주기만 생성합니다.</p>
                <p className="text-xs text-muted-foreground mt-1">생성 후 상세 페이지에서 개별 배정할 수 있습니다.</p>
              </div>
            ) : (
              <>
                {/* 대상 범위 */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetScope("all")}
                    className={cn(
                      "flex-1 p-3 rounded-lg border text-sm font-medium transition-colors",
                      targetScope === "all"
                        ? "bg-foreground text-background border-foreground"
                        : "hover:border-foreground/30"
                    )}
                  >
                    전체 ({allUsers.length}명)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetScope("manual")}
                    className={cn(
                      "flex-1 p-3 rounded-lg border text-sm font-medium transition-colors",
                      targetScope === "manual"
                        ? "bg-foreground text-background border-foreground"
                        : "hover:border-foreground/30"
                    )}
                  >
                    직접 선택
                  </button>
                </div>

                {/* 직접 선택 시 사용자 목록 */}
                {targetScope === "manual" && (
                  <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-3">
                      {Object.entries(usersByDept).map(([deptId, dept]) => {
                        const allDeptSelected = dept.users.every((u) => selectedUserIds.has(u.id));
                        return (
                          <div key={deptId}>
                            <button
                              type="button"
                              onClick={() => toggleDepartment(deptId)}
                              className="flex items-center gap-2 mb-1.5 text-sm font-medium hover:text-foreground text-muted-foreground"
                            >
                              <Checkbox checked={allDeptSelected} />
                              <Users className="h-3.5 w-3.5" />
                              {dept.name} ({dept.users.length}명)
                            </button>
                            <div className="ml-6 space-y-0.5">
                              {dept.users.map((user) => (
                                <label
                                  key={user.id}
                                  className="flex items-center gap-2 p-1 rounded hover:bg-muted/50 cursor-pointer text-sm"
                                >
                                  <Checkbox
                                    checked={selectedUserIds.has(user.id)}
                                    onCheckedChange={() => toggleUser(user.id)}
                                  />
                                  <span>{user.name}</span>
                                  {user.position && (
                                    <span className="text-xs text-muted-foreground">({user.position})</span>
                                  )}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                {/* 미리보기 요약 */}
                <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">예상 배정</p>
                    <span className="text-2xl font-bold">{previewAssignments.length}건</span>
                  </div>
                  {previewAssignments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(previewBreakdown).map(([type, count]) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {REVIEW_TYPE_LABELS[type] ?? type}: {count}건
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    대상: {targetScope === "all" ? `전체 ${allUsers.length}명` : `선택 ${selectedUserIds.size}명`}
                    {" / "}전략: {Array.from(selectedStrategies).map((s) => STRATEGIES.find((st) => st.key === s)?.label).join(", ")}
                  </p>
                </div>
              </>
            )}
          </section>
        )}
      </StepWizard>
    </div>
  );
}
