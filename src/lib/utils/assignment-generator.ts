export type Strategy = "self" | "peer" | "downward" | "upward" | "department_peer";

export interface AssignmentUser {
  id: string;
  name: string;
  position?: string | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  managerId?: string | null;
}

export interface GeneratedAssignment {
  reviewerId: string;
  targetId: string;
  reviewType: string;
}

export const STRATEGIES: { key: Strategy; label: string; description: string }[] = [
  { key: "self", label: "전원 자기평가", description: "선택된 모든 인원이 자기평가를 수행합니다" },
  { key: "peer", label: "동료 상호평가", description: "선택된 인원 간 서로 평가합니다" },
  { key: "downward", label: "리더 → 팀원 평가", description: "리더가 직속 팀원을 평가합니다" },
  { key: "upward", label: "팀원 → 리더 평가", description: "팀원이 직속 리더를 평가합니다" },
  { key: "department_peer", label: "부서별 동료평가", description: "같은 부서 내에서 서로 평가합니다" },
];

export const PRESETS: { key: string; label: string; description: string; strategies: Strategy[] }[] = [
  {
    key: "360",
    label: "360도 평가",
    description: "자기평가 + 동료평가 + 상향평가 + 하향평가",
    strategies: ["self", "peer", "downward", "upward"],
  },
  {
    key: "standard",
    label: "표준 평가",
    description: "자기평가 + 하향평가",
    strategies: ["self", "downward"],
  },
  {
    key: "simple",
    label: "간편 평가",
    description: "자기평가만",
    strategies: ["self"],
  },
];

export function generateAssignments(
  strategies: Strategy[],
  selectedUsers: AssignmentUser[],
  allUsers: AssignmentUser[]
): GeneratedAssignment[] {
  const assignments: GeneratedAssignment[] = [];
  const ids = new Set(selectedUsers.map((u) => u.id));
  const seen = new Set<string>();

  const add = (a: GeneratedAssignment) => {
    const key = `${a.reviewerId}:${a.targetId}:${a.reviewType}`;
    if (!seen.has(key)) {
      seen.add(key);
      assignments.push(a);
    }
  };

  for (const strategy of strategies) {
    switch (strategy) {
      case "self":
        for (const user of selectedUsers) {
          add({ reviewerId: user.id, targetId: user.id, reviewType: "SELF" });
        }
        break;

      case "peer":
        for (const reviewer of selectedUsers) {
          for (const target of selectedUsers) {
            if (reviewer.id !== target.id) {
              add({ reviewerId: reviewer.id, targetId: target.id, reviewType: "PEER" });
            }
          }
        }
        break;

      case "downward":
        for (const user of selectedUsers) {
          const subordinates = allUsers.filter((u) => u.managerId === user.id && ids.has(u.id));
          for (const sub of subordinates) {
            add({ reviewerId: user.id, targetId: sub.id, reviewType: "DOWNWARD" });
          }
        }
        break;

      case "upward":
        for (const user of selectedUsers) {
          if (user.managerId && ids.has(user.managerId)) {
            add({ reviewerId: user.id, targetId: user.managerId, reviewType: "UPWARD" });
          }
        }
        break;

      case "department_peer": {
        const deptMap: Record<string, AssignmentUser[]> = {};
        for (const user of selectedUsers) {
          const deptId = user.departmentId || "none";
          if (!deptMap[deptId]) deptMap[deptId] = [];
          deptMap[deptId].push(user);
        }
        for (const members of Object.values(deptMap)) {
          for (const reviewer of members) {
            for (const target of members) {
              if (reviewer.id !== target.id) {
                add({ reviewerId: reviewer.id, targetId: target.id, reviewType: "PEER" });
              }
            }
          }
        }
        break;
      }
    }
  }

  return assignments;
}

export function getAssignmentBreakdown(assignments: GeneratedAssignment[]) {
  const breakdown: Record<string, number> = {};
  for (const a of assignments) {
    const type = a.reviewType;
    breakdown[type] = (breakdown[type] || 0) + 1;
  }
  return breakdown;
}
