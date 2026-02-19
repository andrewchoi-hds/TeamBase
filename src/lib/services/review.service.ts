import prisma from "@/lib/prisma";
import { ReviewCycleStatus, ReviewType } from "@prisma/client";
import { notificationService } from "./notification.service";

export const reviewService = {
  async createCycle(data: {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    templateId?: string;
  }) {
    return prisma.reviewCycle.create({ data });
  },

  async updateCycleStatus(id: string, status: ReviewCycleStatus) {
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

  async submitReview(reviewId: string) {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status: "SUBMITTED" },
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

    return review;
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
