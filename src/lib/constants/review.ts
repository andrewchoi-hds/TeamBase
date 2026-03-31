export const reviewTypeLabels: Record<string, string> = {
  SELF: "자기평가",
  PEER: "동료평가",
  UPWARD: "상향평가",
  DOWNWARD: "하향평가",
};

export const strategyLabels: Record<string, string> = {
  self: "자기평가",
  peer: "동료 상호평가",
  downward: "하향평가",
  upward: "상향평가",
  department_peer: "부서별 동료평가",
};

export const assignmentStatusLabels: Record<string, string> = {
  PENDING: "대기",
  IN_PROGRESS: "진행중",
  SUBMITTED: "제출완료",
  CANCELLED: "취소",
};

export type ReviewType = "SELF" | "PEER" | "UPWARD" | "DOWNWARD";
export type AssignmentStatus = "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "CANCELLED";
