"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Assignment {
  reviewerId: string;
  targetId: string;
  reviewType: string;
}

interface UserInfo {
  id: string;
  name: string;
  position?: string;
  departmentId?: string;
  department?: { id: string; name: string } | null;
  managerId?: string | null;
}

type Strategy =
  | "self"       // 전원 자기평가
  | "peer"       // 동료 상호평가 (전원)
  | "downward"   // 매니저 → 부하
  | "upward"     // 부하 → 매니저
  | "department_peer"; // 같은 부서 동료평가

const STRATEGIES: { key: Strategy; label: string; description: string }[] = [
  { key: "self", label: "전원 자기평가", description: "선택된 모든 인원이 자기평가를 수행합니다" },
  { key: "peer", label: "동료 상호평가", description: "선택된 인원 간 서로 평가합니다" },
  { key: "downward", label: "매니저 → 부하 평가", description: "매니저가 직속 부하를 평가합니다" },
  { key: "upward", label: "부하 → 매니저 평가", description: "부하가 직속 매니저를 평가합니다" },
  { key: "department_peer", label: "부서별 동료평가", description: "같은 부서 내에서 서로 평가합니다" },
];

const reviewTypeLabels: Record<string, string> = {
  SELF: "자기평가",
  PEER: "동료평가",
  UPWARD: "상향평가",
  DOWNWARD: "하향평가",
};

function generateAssignments(
  strategy: Strategy,
  selectedUsers: UserInfo[],
  allUsers: UserInfo[]
): Assignment[] {
  const assignments: Assignment[] = [];
  const ids = new Set(selectedUsers.map((u) => u.id));

  switch (strategy) {
    case "self":
      for (const user of selectedUsers) {
        assignments.push({ reviewerId: user.id, targetId: user.id, reviewType: "SELF" });
      }
      break;

    case "peer":
      for (const reviewer of selectedUsers) {
        for (const target of selectedUsers) {
          if (reviewer.id !== target.id) {
            assignments.push({ reviewerId: reviewer.id, targetId: target.id, reviewType: "PEER" });
          }
        }
      }
      break;

    case "downward":
      for (const user of selectedUsers) {
        // 이 유저가 매니저인 부하들 찾기
        const subordinates = allUsers.filter((u) => u.managerId === user.id && ids.has(u.id));
        for (const sub of subordinates) {
          assignments.push({ reviewerId: user.id, targetId: sub.id, reviewType: "DOWNWARD" });
        }
      }
      break;

    case "upward":
      for (const user of selectedUsers) {
        if (user.managerId && ids.has(user.managerId)) {
          assignments.push({ reviewerId: user.id, targetId: user.managerId, reviewType: "UPWARD" });
        }
      }
      break;

    case "department_peer":
      // 부서별로 그룹화
      const deptMap: Record<string, UserInfo[]> = {};
      for (const user of selectedUsers) {
        const deptId = user.departmentId || "none";
        if (!deptMap[deptId]) deptMap[deptId] = [];
        deptMap[deptId].push(user);
      }
      for (const members of Object.values(deptMap)) {
        for (const reviewer of members) {
          for (const target of members) {
            if (reviewer.id !== target.id) {
              assignments.push({ reviewerId: reviewer.id, targetId: target.id, reviewType: "PEER" });
            }
          }
        }
      }
      break;
  }

  return assignments;
}

interface BulkAssignmentDialogProps {
  cycleId: string;
  existingAssignments: { reviewerId: string; targetId: string; reviewType: string }[];
}

export function BulkAssignmentDialog({ cycleId, existingAssignments }: BulkAssignmentDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"strategy" | "users" | "preview">("strategy");
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const { data: users } = useQuery({
    queryKey: ["users-with-dept"],
    queryFn: () => api.get<UserInfo[]>("/users"),
    enabled: open,
  });

  const allUsers = users ?? [];

  const selectedUsers = useMemo(
    () => allUsers.filter((u) => selectedUserIds.has(u.id)),
    [allUsers, selectedUserIds]
  );

  const generatedAssignments = useMemo(() => {
    if (!selectedStrategy || selectedUsers.length === 0) return [];
    return generateAssignments(selectedStrategy, selectedUsers, allUsers);
  }, [selectedStrategy, selectedUsers, allUsers]);

  // 기존 할당과 겹치지 않는 새 할당만
  const newAssignments = useMemo(() => {
    const existingSet = new Set(
      existingAssignments.map((a) => `${a.reviewerId}:${a.targetId}:${a.reviewType}`)
    );
    return generatedAssignments.filter(
      (a) => !existingSet.has(`${a.reviewerId}:${a.targetId}:${a.reviewType}`)
    );
  }, [generatedAssignments, existingAssignments]);

  const duplicateCount = generatedAssignments.length - newAssignments.length;

  const createMutation = useMutation({
    mutationFn: () =>
      api.post(`/review-cycles/${cycleId}/assignments`, { assignments: newAssignments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-cycle", cycleId] });
      toast.success(`${newAssignments.length}건의 평가가 배정되었습니다.`);
      handleClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleClose = () => {
    setOpen(false);
    setStep("strategy");
    setSelectedStrategy(null);
    setSelectedUserIds(new Set());
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedUserIds.size === allUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(allUsers.map((u) => u.id)));
    }
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

  // 부서별 그룹핑
  const usersByDept = useMemo(() => {
    const map: Record<string, { name: string; users: UserInfo[] }> = {};
    for (const user of allUsers) {
      const deptId = user.departmentId || "none";
      const deptName = user.department?.name || "부서 미지정";
      if (!map[deptId]) map[deptId] = { name: deptName, users: [] };
      map[deptId].users.push(user);
    }
    return map;
  }, [allUsers]);

  const getUserName = (id: string) => allUsers.find((u) => u.id === id)?.name ?? id;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Zap className="mr-1 h-4 w-4" />
          일괄 배정
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === "strategy" && "배정 전략 선택"}
            {step === "users" && "대상자 선택"}
            {step === "preview" && "배정 미리보기"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: 전략 선택 */}
        {step === "strategy" && (
          <div className="space-y-2">
            {STRATEGIES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  setSelectedStrategy(s.key);
                  setStep("users");
                }}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-colors hover:border-foreground/30",
                  selectedStrategy === s.key ? "bg-foreground text-background border-foreground" : "bg-background"
                )}
              >
                <p className="font-medium text-sm">{s.label}</p>
                <p className={cn("text-xs mt-0.5", selectedStrategy === s.key ? "text-background/70" : "text-muted-foreground")}>
                  {s.description}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: 대상자 선택 */}
        {step === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedUserIds.size}명 선택됨
              </p>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedUserIds.size === allUsers.length ? "전체 해제" : "전체 선택"}
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {Object.entries(usersByDept).map(([deptId, dept]) => {
                  const allDeptSelected = dept.users.every((u) => selectedUserIds.has(u.id));
                  return (
                    <div key={deptId}>
                      <button
                        type="button"
                        onClick={() => toggleDepartment(deptId)}
                        className="flex items-center gap-2 mb-2 text-sm font-medium hover:text-foreground text-muted-foreground"
                      >
                        <Checkbox checked={allDeptSelected} />
                        <Users className="h-3.5 w-3.5" />
                        {dept.name} ({dept.users.length}명)
                      </button>
                      <div className="ml-6 space-y-1">
                        {dept.users.map((user) => (
                          <label
                            key={user.id}
                            className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
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

            <div className="flex justify-between pt-2 border-t">
              <Button variant="ghost" onClick={() => setStep("strategy")}>이전</Button>
              <Button onClick={() => setStep("preview")} disabled={selectedUserIds.size === 0}>
                다음 ({selectedUserIds.size}명)
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: 미리보기 */}
        {step === "preview" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{generatedAssignments.length}</p>
                <p className="text-xs text-muted-foreground">전체 생성</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                <p className="text-2xl font-bold text-green-600">{newAssignments.length}</p>
                <p className="text-xs text-muted-foreground">신규 배정</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-muted-foreground">{duplicateCount}</p>
                <p className="text-xs text-muted-foreground">중복 (건너뜀)</p>
              </div>
            </div>

            {/* Assignment List */}
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-1">
                {newAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    모든 배정이 이미 존재합니다. 새로 추가할 항목이 없습니다.
                  </p>
                ) : (
                  newAssignments.map((a, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 text-sm border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getUserName(a.reviewerId)}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{getUserName(a.targetId)}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {reviewTypeLabels[a.reviewType]}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="flex justify-between pt-2 border-t">
              <Button variant="ghost" onClick={() => setStep("users")}>이전</Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={newAssignments.length === 0 || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                {newAssignments.length}건 배정하기
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
