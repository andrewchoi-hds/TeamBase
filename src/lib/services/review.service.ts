import prisma from "@/lib/prisma";
import { ReviewCycleStatus, ReviewType } from "@prisma/client";
import { notificationService } from "./notification.service";
import { auditLogService } from "./audit-log.service";
import {
  generateAssignments as generateAssignmentsUtil,
  getAssignmentBreakdown,
  type Strategy,
} from "@/lib/utils/assignment-generator";

export const reviewService = {
  async createCycle(data: {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    templateId?: string;
    assignmentRules?: { strategies: Strategy[]; targetUserIds?: string[] };
  }) {
    return prisma.reviewCycle.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        templateId: data.templateId,
        assignmentRules: data.assignmentRules ?? undefined,
      },
    });
  },

  async previewAssignments(strategies: Strategy[], targetUserIds?: string[]) {
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, position: true, departmentId: true, department: { select: { id: true, name: true } }, managerId: true },
    });

    const selectedUsers = targetUserIds
      ? allUsers.filter((u) => targetUserIds.includes(u.id))
      : allUsers;

    const assignments = generateAssignmentsUtil(strategies, selectedUsers, allUsers);
    const breakdown = getAssignmentBreakdown(assignments);

    return { totalAssignments: assignments.length, breakdown, assignments };
  },

  async generateAndCreateAssignments(cycleId: string, strategies: Strategy[], targetUserIds?: string[]) {
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, position: true, departmentId: true, department: { select: { id: true, name: true } }, managerId: true },
    });

    const selectedUsers = targetUserIds
      ? allUsers.filter((u) => targetUserIds.includes(u.id))
      : allUsers;

    const assignments = generateAssignmentsUtil(strategies, selectedUsers, allUsers);

    if (assignments.length === 0) return { count: 0 };

    const result = await prisma.reviewAssignment.createMany({
      data: assignments.map((a) => ({ ...a, cycleId, reviewType: a.reviewType as ReviewType })),
      skipDuplicates: true,
    });

    return { count: result.count };
  },

  async updateCycleStatus(id: string, status: ReviewCycleStatus, userId?: string) {
    const cycle = await prisma.reviewCycle.update({
      where: { id },
      data: { status },
      include: { assignments: { include: { reviewer: true } } },
    });

    if (status === "ACTIVE") {
      const notifications = cycle.assignments.map((a: any) => ({
        userId: a.reviewerId,
        type: "REVIEW_REQUESTED" as const,
        title: "새로운 평가 요청",
        message: `"${cycle.name}" 평가 주기가 시작되었습니다. 할당된 평가를 작성해주세요.`,
        link: `/reviews/${id}`,
      }));
      await notificationService.createMany(notifications);
    }

    await auditLogService.log({
      action: "STATUS_CHANGE",
      entityType: "REVIEW_CYCLE",
      entityId: id,
      userId: userId ?? null,
      changes: { status },
    });

    return cycle;
  },

  async createAssignments(cycleId: string, assignments: { reviewerId: string; targetId: string; reviewType: ReviewType }[]) {
    return prisma.reviewAssignment.createMany({
      data: assignments.map((a) => ({ ...a, cycleId })),
      skipDuplicates: true,
    });
  },

  async getMyAssignments(userId: string, cycleId?: string) {
    return prisma.reviewAssignment.findMany({
      where: {
        reviewerId: userId,
        ...(cycleId ? { cycleId } : {}),
        status: { not: "CANCELLED" },
      },
      include: {
        target: { select: { id: true, name: true, position: true, department: true } },
        cycle: { select: { id: true, name: true, status: true, endDate: true } },
        review: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async submitReview(reviewId: string, userId?: string) {
    // 마감일 검증: 사이클이 ACTIVE이고 마감 전인지 확인
    const reviewForCheck = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { cycle: { select: { status: true, endDate: true } } },
    });
    if (!reviewForCheck) throw new Error("평가를 찾을 수 없습니다.");
    if (reviewForCheck.cycle.status !== "ACTIVE") {
      throw new Error("이 평가 주기는 종료되었습니다. 더 이상 제출할 수 없습니다.");
    }
    if (new Date() > new Date(reviewForCheck.cycle.endDate)) {
      throw new Error("평가 마감 기한이 지났습니다. 관리자에게 기한 연장을 요청하세요.");
    }

    // RATING 유형 응답에 카테고리 가중치를 반영하여 overallRating 계산
    const responses = await prisma.reviewResponse.findMany({
      where: { reviewId },
      select: {
        rating: true,
        criterion: {
          select: {
            category: { select: { id: true, weight: true } },
          },
        },
      },
    });
    const ratedResponses = responses.filter((r) => r.rating != null);

    let overallRating: number | null = null;
    if (ratedResponses.length > 0) {
      // 카테고리별 평균 점수 계산
      const catScores: Record<string, { sum: number; count: number; weight: number }> = {};
      for (const r of ratedResponses) {
        const catId = r.criterion.category.id;
        const catWeight = r.criterion.category.weight;
        if (!catScores[catId]) catScores[catId] = { sum: 0, count: 0, weight: catWeight };
        catScores[catId].sum += r.rating as number;
        catScores[catId].count++;
      }

      const cats = Object.values(catScores);
      const hasVariedWeights = cats.some((c) => c.weight !== 1.0);

      if (hasVariedWeights && cats.length > 0) {
        // 가중 평균: sum(catAvg * weight) / sum(weight)
        const totalWeight = cats.reduce((sum, c) => sum + c.weight, 0);
        overallRating = totalWeight > 0
          ? parseFloat((cats.reduce((sum, c) => sum + (c.sum / c.count) * c.weight, 0) / totalWeight).toFixed(2))
          : null;
      } else {
        // 기존 방식: 단순 평균
        overallRating = parseFloat((ratedResponses.reduce((sum, r) => sum + (r.rating as number), 0) / ratedResponses.length).toFixed(2));
      }
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status: "SUBMITTED", overallRating },
      include: { target: true, author: true, cycle: true },
    });

    await prisma.reviewAssignment.update({
      where: { id: review.assignmentId },
      data: { status: "SUBMITTED" },
    });

    await notificationService.create({
      userId: review.targetId,
      type: "REVIEW_SUBMITTED",
      title: "평가가 제출되었습니다",
      message: `"${review.cycle.name}" 평가 주기에서 새로운 평가가 제출되었습니다.`,
      link: `/reviews/${review.cycleId}/results/${review.targetId}`,
    });

    await auditLogService.log({
      action: "SUBMIT",
      entityType: "REVIEW",
      entityId: reviewId,
      userId: userId ?? review.authorId,
      changes: { status: "SUBMITTED" },
    });

    return review;
  },

  async forceCompleteCycle(cycleId: string, cancelIncomplete: boolean, userId: string) {
    const cycle = await prisma.reviewCycle.findUnique({
      where: { id: cycleId },
      select: { id: true, name: true, status: true },
    });
    if (!cycle) throw new Error("평가 주기를 찾을 수 없습니다.");
    if (cycle.status !== "ACTIVE") throw new Error("활성 상태의 평가 주기만 종료할 수 있습니다.");

    await prisma.$transaction(async (tx) => {
      await tx.reviewCycle.update({
        where: { id: cycleId },
        data: { status: "COMPLETED" },
      });
      if (cancelIncomplete) {
        await tx.reviewAssignment.updateMany({
          where: { cycleId, status: { in: ["PENDING", "IN_PROGRESS"] } },
          data: { status: "CANCELLED" },
        });
      }
    });

    await auditLogService.log({
      action: "STATUS_CHANGE",
      entityType: "REVIEW_CYCLE",
      entityId: cycleId,
      userId,
      changes: { status: "COMPLETED", cancelIncomplete },
      metadata: { cycleName: cycle.name, forceCompleted: true },
    });

    return cycle;
  },

  async reopenAssignment(assignmentId: string, userId: string, reason?: string) {
    const assignment = await prisma.reviewAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        cycle: true,
        review: true,
        reviewer: { select: { id: true, name: true, email: true } },
        target: { select: { id: true, name: true } },
      },
    });

    if (!assignment) throw new Error("배정을 찾을 수 없습니다.");
    if (assignment.status !== "SUBMITTED") throw new Error("제출된 평가만 재오픈할 수 있습니다.");
    if (assignment.cycle.status !== "ACTIVE") throw new Error("활성 상태의 평가 주기만 재오픈 가능합니다.");

    await prisma.$transaction(async (tx) => {
      await tx.reviewAssignment.update({
        where: { id: assignmentId },
        data: { status: "IN_PROGRESS" },
      });

      if (assignment.review) {
        await tx.review.update({
          where: { id: assignment.review.id },
          data: { status: "DRAFT" },
        });
      }
    });

    await auditLogService.log({
      action: "REOPEN",
      entityType: "REVIEW_ASSIGNMENT",
      entityId: assignmentId,
      userId,
      changes: { status: "IN_PROGRESS", reason },
      metadata: { reviewerId: assignment.reviewerId, targetId: assignment.targetId },
    });

    await notificationService.create({
      userId: assignment.reviewerId,
      type: "REVIEW_REOPENED",
      title: "평가가 재오픈되었습니다",
      message: `"${assignment.cycle.name}" 평가 주기에서 ${assignment.target.name}님에 대한 평가가 재오픈되었습니다.${reason ? ` 사유: ${reason}` : ""}`,
      link: `/reviews/${assignment.cycleId}`,
    });

    return assignment;
  },

  async getReviewResults(cycleId: string, targetId: string) {
    return prisma.review.findMany({
      where: { cycleId, targetId, status: "SUBMITTED" },
      include: {
        author: { select: { id: true, name: true } },
        target: { select: { id: true, name: true, position: true } },
        assignment: { select: { reviewType: true } },
        responses: { include: { criterion: { include: { category: true } } } },
      },
    });
  },
};
