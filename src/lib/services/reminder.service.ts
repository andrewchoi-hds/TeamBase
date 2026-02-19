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
   * 평가 마감 임박 알림 (endDate 3일/1일 전, ACTIVE 사이클)
   */
  async sendReviewDeadlineReminders() {
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const oneDayLater = new Date(now);
    oneDayLater.setDate(oneDayLater.getDate() + 1);

    const activeCycles = await prisma.reviewCycle.findMany({
      where: {
        status: "ACTIVE",
        endDate: { gte: now, lte: threeDaysLater },
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

  /**
   * 미팅 리마인더 (scheduledAt 1시간 전, SCHEDULED 상태)
   */
  async sendMeetingReminders() {
    const now = new Date();
    const oneHourLater = new Date(now);
    oneHourLater.setHours(oneHourLater.getHours() + 1);

    const upcomingMeetings = await prisma.meeting.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: now, lte: oneHourLater },
      },
      include: {
        organizer: { select: { id: true, name: true } },
        participant: { select: { id: true, name: true } },
      },
    });

    let count = 0;
    for (const meeting of upcomingMeetings) {
      const userIds = [meeting.organizerId, meeting.participantId];

      for (const userId of userIds) {
        const exists = await notificationService.existsToday(
          userId,
          "MEETING_REMINDER",
          `/meetings/${meeting.id}`
        );
        if (exists) continue;

        await notificationService.create({
          userId,
          type: "MEETING_REMINDER",
          title: "미팅 알림",
          message: `"${meeting.title}" 미팅이 곧 시작됩니다.`,
          link: `/meetings/${meeting.id}`,
        });
        count++;
      }
    }
    return count;
  },

  /**
   * OKR 주간 체크인 (매주 월요일, ACTIVE 목표)
   */
  async sendOkrCheckInReminders() {
    const now = new Date();
    // 월요일인지 확인 (0=일, 1=월)
    if (now.getDay() !== 1) return 0;

    const activeObjectives = await prisma.objective.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, title: true, ownerId: true },
    });

    let count = 0;
    for (const obj of activeObjectives) {
      const exists = await notificationService.existsToday(
        obj.ownerId,
        "OKR_CHECK_IN_DUE",
        `/objectives/${obj.id}`
      );
      if (exists) continue;

      await notificationService.create({
        userId: obj.ownerId,
        type: "OKR_CHECK_IN_DUE",
        title: "OKR 주간 체크인",
        message: `"${obj.title}" 목표의 진행 상황을 업데이트해주세요.`,
        link: `/objectives/${obj.id}`,
      });
      count++;
    }
    return count;
  },
};
