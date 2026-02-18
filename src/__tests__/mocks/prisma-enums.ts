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
  FEEDBACK_RECEIVED: "FEEDBACK_RECEIVED",
  MEETING_SCHEDULED: "MEETING_SCHEDULED",
  MEETING_REMINDER: "MEETING_REMINDER",
  OKR_CHECK_IN_DUE: "OKR_CHECK_IN_DUE",
  ACCESS_LOG_ALERT: "ACCESS_LOG_ALERT",
} as const;

export const ResourceType = {
  REVIEW: "REVIEW",
  FEEDBACK: "FEEDBACK",
  OKR: "OKR",
  PROFILE: "PROFILE",
  MEETING: "MEETING",
} as const;

export const ObjectiveStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const ObjectiveLevel = {
  COMPANY: "COMPANY",
  TEAM: "TEAM",
  INDIVIDUAL: "INDIVIDUAL",
} as const;
