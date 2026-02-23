import { describe, it, expect } from "vitest";
import {
  generateAssignments,
  getAssignmentBreakdown,
  PRESETS,
  STRATEGIES,
  type AssignmentUser,
} from "@/lib/utils/assignment-generator";

const users: AssignmentUser[] = [
  { id: "u1", name: "김팀장", departmentId: "d1", managerId: null },
  { id: "u2", name: "이대리", departmentId: "d1", managerId: "u1" },
  { id: "u3", name: "박사원", departmentId: "d1", managerId: "u1" },
  { id: "u4", name: "최팀장", departmentId: "d2", managerId: null },
  { id: "u5", name: "정대리", departmentId: "d2", managerId: "u4" },
];

describe("assignment-generator", () => {
  describe("generateAssignments", () => {
    it("self: 모든 사용자가 자기평가를 수행한다", () => {
      const result = generateAssignments(["self"], users, users);
      expect(result).toHaveLength(5);
      expect(result.every((a) => a.reviewerId === a.targetId)).toBe(true);
      expect(result.every((a) => a.reviewType === "SELF")).toBe(true);
    });

    it("peer: N*(N-1) 조합이 생성된다", () => {
      const result = generateAssignments(["peer"], users, users);
      expect(result).toHaveLength(5 * 4); // 20
      expect(result.every((a) => a.reviewType === "PEER")).toBe(true);
      expect(result.every((a) => a.reviewerId !== a.targetId)).toBe(true);
    });

    it("downward: 매니저가 부하를 평가한다", () => {
      const result = generateAssignments(["downward"], users, users);
      // u1 → u2, u1 → u3, u4 → u5 = 3건
      expect(result).toHaveLength(3);
      expect(result.every((a) => a.reviewType === "DOWNWARD")).toBe(true);
    });

    it("upward: 부하가 매니저를 평가한다", () => {
      const result = generateAssignments(["upward"], users, users);
      // u2 → u1, u3 → u1, u5 → u4 = 3건
      expect(result).toHaveLength(3);
      expect(result.every((a) => a.reviewType === "UPWARD")).toBe(true);
    });

    it("department_peer: 같은 부서 내 동료평가만 생성한다", () => {
      const result = generateAssignments(["department_peer"], users, users);
      // d1: 3명 → 6조합, d2: 2명 → 2조합 = 8건
      expect(result).toHaveLength(8);
      expect(result.every((a) => a.reviewType === "PEER")).toBe(true);
    });

    it("여러 전략 조합 시 중복이 제거된다", () => {
      const result = generateAssignments(["self", "self"], users, users);
      expect(result).toHaveLength(5); // 중복 자기평가 제거
    });

    it("selectedUsers가 없으면 빈 배열을 반환한다", () => {
      const result = generateAssignments(["self"], [], users);
      expect(result).toHaveLength(0);
    });
  });

  describe("getAssignmentBreakdown", () => {
    it("유형별 건수를 집계한다", () => {
      const assignments = generateAssignments(["self", "downward"], users, users);
      const breakdown = getAssignmentBreakdown(assignments);
      expect(breakdown.SELF).toBe(5);
      expect(breakdown.DOWNWARD).toBe(3);
    });
  });

  describe("PRESETS", () => {
    it("360도 프리셋이 4가지 전략을 포함한다", () => {
      const preset360 = PRESETS.find((p) => p.key === "360");
      expect(preset360?.strategies).toEqual(["self", "peer", "downward", "upward"]);
    });

    it("모든 프리셋 전략이 STRATEGIES에 정의되어 있다", () => {
      const strategyKeys = STRATEGIES.map((s) => s.key);
      for (const preset of PRESETS) {
        for (const s of preset.strategies) {
          expect(strategyKeys).toContain(s);
        }
      }
    });
  });
});
