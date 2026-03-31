import prisma from "@/lib/prisma";
import { notificationService } from "./notification.service";
import { auditLogService } from "./audit-log.service";

export const reminderService = {
  /**
   * 만료된 ACTIVE 사이클을 자동 종료
   * endDate < now인 사이클을 COMPLETED로 전환, 미제출 배정을 CANCELLED로 처리
   */
  async autoCloseExpiredCycles() {
    const now = new Date();

    const expiredCycles = await prisma.reviewCycle.findMany({
      where: { status: "ACTIVE", endDate: { lt: now } },
      select: { id: true, name: true },
    });

    let count = 0;
    for (const cycle of expiredCycles) {
      await prisma.$transaction(async (tx) => {
        await tx.reviewCycle.update({
          where: { id: cycle.id },
          data: { status: "COMPLETED" },
        });

        await tx.reviewAssignment.updateMany({
          where: {
            cycleId: cycle.id,
            status: { in: ["PENDING", "IN_PROGRESS"] },
          },
          data: { status: "CANCELLED" },
        });
      });

      await auditLogService.log({
        action: "AUTO_CLOSE",
        entityType: "REVIEW_CYCLE",
        entityId: cycle.id,
        userId: null,
        metadata: { cycleName: cycle.name, closedAt: now.toISOString() },
      });

      count++;
    }
    return count;
  },

  /**
   * 관리자에게 팀원 미제출 현황 알림
   * 마감 7일 전부터 관리자에게 "팀원 N명이 평가를 완료하지 않았습니다" 알림 발송
   */
  async sendManagerReminders() {
    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const activeCycles = await prisma.reviewCycle.findMany({
      where: {
        status: "ACTIVE",
        endDate: { lte: sevenDaysLater },
      },
      include: {
        assignments: {
          where: { status: { not: "SUBMITTED" } },
          select: {
            reviewer: { select: { id: true, name: true, managerId: true } },
          },
        },
      },
    });

    let count = 0;
    for (const cycle of activeCycles) {
      // managerId별로 미제출 팀원 그룹화
      const managerMap = new Map<string, string[]>();
      for (const a of cycle.assignments) {
        const managerId = a.reviewer.managerId;
        if (!managerId) continue;
        if (!managerMap.has(managerId)) managerMap.set(managerId, []);
        const names = managerMap.get(managerId)!;
        if (!names.includes(a.reviewer.name)) names.push(a.reviewer.name);
      }

      for (const [managerId, memberNames] of managerMap) {
        const exists = await notificationService.existsToday(
          managerId,
          "REVIEW_CYCLE_ENDING",
          `/reviews/${cycle.id}`
        );
        if (exists) continue;

        await notificationService.create({
          userId: managerId,
          type: "REVIEW_CYCLE_ENDING",
          title: "팀원 평가 미완료 알림",
          message: `"${cycle.name}" — 팀원 ${memberNames.length}명(${memberNames.slice(0, 3).join(", ")}${memberNames.length > 3 ? " 외" : ""})이 아직 평가를 완료하지 않았습니다.`,
          link: `/reviews/${cycle.id}`,
        });
        count++;
      }
    }
    return count;
  },

  /**
   * 평가 마감 임박 알림 (endDate 7일 전부터, ACTIVE 사이클)
   */
  async sendReviewDeadlineReminders() {
    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const activeCycles = await prisma.reviewCycle.findMany({
      where: {
        status: "ACTIVE",
        endDate: { gte: now, lte: sevenDaysLater },
      },
      include: {
        assignments: {
          where: { status: { not: "SUBMITTED" } },
          select: { reviewerId: true },
        },
      },
    });

    let count = 0;
    for (const cycle of activeCycles) {
      const daysLeft = Math.ceil((cycle.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const userIds = Array.from(new Set(cycle.assignments.map((a) => a.reviewerId)));

      for (const userId of userIds) {
        const exists = await notificationService.existsToday(
          userId,
          "REVIEW_CYCLE_ENDING",
          `/reviews/${cycle.id}`
        );
        if (exists) continue;

        await notificationService.create({
          userId,
          type: "REVIEW_CYCLE_ENDING",
          title: "평가 마감 임박",
          message: `"${cycle.name}" 평가가 ${daysLeft}일 후 마감됩니다. 미완료 평가를 작성해주세요.`,
          link: `/reviews/${cycle.id}`,
        });
        count++;
      }
    }
    return count;
  },

  /**
   * 미완료 평가 독촉 (endDate 지남, status !== SUBMITTED)
   */
  async sendOverdueReviewReminders() {
    const now = new Date();

    const overdueCycles = await prisma.reviewCycle.findMany({
      where: {
        status: "ACTIVE",
        endDate: { lt: now },
      },
      include: {
        assignments: {
          where: { status: { not: "SUBMITTED" } },
          select: { reviewerId: true },
        },
      },
    });

    let count = 0;
    for (const cycle of overdueCycles) {
      const userIds = Array.from(new Set(cycle.assignments.map((a) => a.reviewerId)));

      for (const userId of userIds) {
        const exists = await notificationService.existsToday(
          userId,
          "REVIEW_CYCLE_ENDING",
          `/reviews/${cycle.id}`
        );
        if (exists) continue;

        await notificationService.create({
          userId,
          type: "REVIEW_CYCLE_ENDING",
          title: "미완료 평가 알림",
          message: `"${cycle.name}" 평가 마감이 지났습니다. 아직 작성하지 않은 평가를 완료해주세요.`,
          link: `/reviews/${cycle.id}`,
        });
        count++;
      }
    }
    return count;
  },
};
