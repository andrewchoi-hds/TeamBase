// Prisma enum 순수 TS 재정의 (테스트에서 @prisma/client 대신 사용)
export const Role = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  MEMBER: "MEMBER",
} as const;

export const ReviewCycleStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const ReviewType = {
  SELF: "SELF",
  PEER: "PEER",
  UPWARD: "UPWARD",
  DOWNWARD: "DOWNWARD",
} as const;

export const ReviewStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
} as const;

export const ReviewAssignmentStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
  CANCELLED: "CANCELLED",
} as const;

export const FeedbackCategory = {
  STRENGTH: "STRENGTH",
  IMPROVEMENT: "IMPROVEMENT",
  GENERAL: "GENERAL",
} as const;

export const NotificationType = {
  REVIEW_REQUESTED: "REVIEW_REQUESTED",
  REVIEW_SUBMITTED: "REVIEW_SUBMITTED",
  REVIEW_CYCLE_STARTED: "REVIEW_CYCLE_STARTED",
  REVIEW_CYCLE_ENDING: "REVIEW_CYCLE_ENDING",
  REVIEW_REOPENED: "REVIEW_REOPENED",
  FEEDBACK_RECEIVED: "FEEDBACK_RECEIVED",
  ACCESS_LOG_ALERT: "ACCESS_LOG_ALERT",
} as const;

export const ResourceType = {
  REVIEW: "REVIEW",
  FEEDBACK: "FEEDBACK",
  PROFILE: "PROFILE",
} as const;

export const DevelopmentGoalStatus = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const FeedbackSessionMode = {
  NAMED: "NAMED",
  ANONYMOUS: "ANONYMOUS",
} as const;

export const FeedbackSessionStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
} as const;
