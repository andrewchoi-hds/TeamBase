"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { StepWizard } from "@/components/common/step-wizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ArrowLeft, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "기본 설정", description: "이름과 모드" },
  { title: "대상자 선택", description: "피드백 받을 사람" },
  { title: "확인", description: "설정 확인" },
];

export default function NewFeedbackSessionPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"NAMED" | "ANONYMOUS">("NAMED");
  const [minResponses, setMinResponses] = useState(3);

  // Step 2
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const { data: users } = useQuery({
    queryKey: ["users-for-session"],
    queryFn: () => api.get<any[]>("/users"),
    enabled: currentStep >= 1,
  });

  const allUsers = users ?? [];

  const usersByDept = useMemo(() => {
    const map: Record<string, { name: string; users: any[] }> = {};
    for (const user of allUsers) {
      const deptId = user.departmentId || "none";
      const deptName = user.department?.name || "부서 미지정";
      if (!map[deptId]) map[deptId] = { name: deptName, users: [] };
      map[deptId].users.push(user);
    }
    return map;
  }, [allUsers]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleDepartment = (deptId: string) => {
    const deptUsers = allUsers.filter((u: any) => (u.departmentId || "none") === deptId);
    const allSelected = deptUsers.every((u: any) => selectedUserIds.has(u.id));
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      for (const u of deptUsers) {
        if (allSelected) next.delete(u.id);
        else next.add(u.id);
      }
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/feedback-sessions", {
        name,
        description: description || undefined,
        mode,
        minResponsesForVisibility: mode === "ANONYMOUS" ? minResponses : 1,
        targetUserIds: Array.from(selectedUserIds),
      }),
    onSuccess: () => {
      toast.success("피드백 세션이 생성되었습니다.");
      router.push("/admin/feedback-sessions");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!name.trim();
      case 1: return selectedUserIds.size > 0;
      case 2: return true;
      default: return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </button>
        <h1 className="text-2xl font-bold tracking-tight">새 피드백 세션</h1>
        <p className="text-muted-foreground mt-1">구조화된 피드백 세션을 생성합니다.</p>
      </div>

      <StepWizard
        steps={STEPS}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onSubmit={() => mutation.mutate()}
        submitLabel="세션 생성"
        isSubmitting={mutation.isPending}
        canProceed={canProceed()}
      >
        {/* Step 1: 기본 설정 */}
        {currentStep === 0 && (
          <section className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                세션 이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="예: 2026년 1분기 동료 피드백"
                className="h-11"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">설명</Label>
              <Textarea
                placeholder="이 세션의 목적과 안내사항을 작성하세요."
                className="min-h-[80px] resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">피드백 모드</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["NAMED", "ANONYMOUS"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-colors",
                      mode === m
                        ? "bg-foreground text-background border-foreground"
                        : "hover:border-foreground/30"
                    )}
                  >
                    <p className="text-sm font-medium">{m === "NAMED" ? "기명" : "익명"}</p>
                    <p className={cn("text-xs mt-0.5", mode === m ? "text-background/70" : "text-muted-foreground")}>
                      {m === "NAMED" ? "작성자 이름이 공개됩니다" : "작성자가 익명으로 처리됩니다"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            {mode === "ANONYMOUS" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">최소 응답 수 (공개 기준)</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={minResponses}
                  onChange={(e) => setMinResponses(Number(e.target.value))}
                  className="w-24"
                />
                <p className="text-xs text-muted-foreground">
                  이 수 이상의 피드백이 모여야 대상자에게 공개됩니다.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Step 2: 대상자 선택 */}
        {currentStep === 1 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{selectedUserIds.size}명 선택됨</p>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => {
                  if (selectedUserIds.size === allUsers.length) setSelectedUserIds(new Set());
                  else setSelectedUserIds(new Set(allUsers.map((u: any) => u.id)));
                }}
              >
                {selectedUserIds.size === allUsers.length ? "전체 해제" : "전체 선택"}
              </button>
            </div>
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-3">
                {Object.entries(usersByDept).map(([deptId, dept]) => {
                  const allDeptSelected = dept.users.every((u: any) => selectedUserIds.has(u.id));
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
                        {dept.users.map((user: any) => (
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
          </section>
        )}

        {/* Step 3: 확인 */}
        {currentStep === 2 && (
          <section className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">세션 이름</span>
                <span className="text-sm font-medium">{name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">모드</span>
                <span className="text-sm font-medium">{mode === "NAMED" ? "기명" : "익명"}</span>
              </div>
              {mode === "ANONYMOUS" && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">최소 응답 수</span>
                  <span className="text-sm font-medium">{minResponses}건</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">대상자</span>
                <span className="text-sm font-medium">{selectedUserIds.size}명</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              세션은 DRAFT 상태로 생성됩니다. 목록에서 &quot;시작&quot; 버튼을 눌러 참여자에게 공개하세요.
            </p>
          </section>
        )}
      </StepWizard>
    </div>
  );
}
