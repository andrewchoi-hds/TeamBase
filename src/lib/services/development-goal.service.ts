import prisma from "@/lib/prisma";
import { DevelopmentGoalStatus } from "@prisma/client";
import { auditLogService } from "./audit-log.service";

interface CreateGoalInput {
  ownerId: string;
  title: string;
  description?: string;
  sourceType?: string;
  sourceCycleId?: string;
  targetDate?: string;
  feedbackIds?: { sessionResponseId?: string }[];
}

interface UpdateGoalInput {
  title?: string;
  description?: string;
  status?: DevelopmentGoalStatus;
  progress?: number;
  targetDate?: string | null;
}

export const developmentGoalService = {
  async create(input: CreateGoalInput, userId: string) {
    const goal = await prisma.developmentGoal.create({
      data: {
        ownerId: input.ownerId,
        title: input.title,
        description: input.description,
        sourceType: input.sourceType ?? "SELF",
        sourceCycleId: input.sourceCycleId,
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
        feedbackLinks: input.feedbackIds?.length
          ? {
              create: input.feedbackIds.map((fb) => ({
                sessionResponseId: fb.sessionResponseId ?? null,
              })),
            }
          : undefined,
      },
      include: {
        feedbackLinks: true,
        sourceCycle: { select: { id: true, name: true } },
      },
    });

    await auditLogService.log({
      action: "CREATE",
      entityType: "DEVELOPMENT_GOAL",
      entityId: goal.id,
      userId,
      changes: {
        title: input.title,
        description: input.description ?? null,
        sourceType: input.sourceType ?? "SELF",
        sourceCycleId: input.sourceCycleId ?? null,
        targetDate: input.targetDate ?? null,
      },
      metadata: {
        ownerId: input.ownerId,
        linkedFeedbackIds: input.feedbackIds ?? [],
      },
    });

    return goal;
  },

  async getByOwner(ownerId: string, status?: DevelopmentGoalStatus) {
    return prisma.developmentGoal.findMany({
      where: {
        ownerId,
        ...(status ? { status } : {}),
      },
      include: {
        feedbackLinks: {
          include: {
            sessionResponse: { select: { id: true, content: true, category: true } },
          },
        },
        sourceCycle: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    return prisma.developmentGoal.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, position: true, managerId: true } },
        feedbackLinks: {
          include: {
            sessionResponse: { select: { id: true, content: true, category: true, authorId: true } },
          },
        },
        sourceCycle: { select: { id: true, name: true } },
      },
    });
  },

  async update(id: string, input: UpdateGoalInput, userId: string) {
    const existing = await prisma.developmentGoal.findUnique({ where: { id } });
    if (!existing) throw new Error("개선 목표를 찾을 수 없습니다.");

    // 명시적 상태 지정이 없을 때만 자동 완료 적용
    const autoCompleted =
      input.status == null &&
      input.progress != null &&
      input.progress >= 100 &&
      existing.status === "ACTIVE";

    const goal = await prisma.developmentGoal.update({
      where: { id },
      data: {
        ...(input.title != null && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status != null && { status: input.status }),
        ...(input.progress != null && { progress: Math.min(input.progress, 100) }),
        ...(input.targetDate !== undefined && { targetDate: input.targetDate ? new Date(input.targetDate) : null }),
        ...(autoCompleted && {
          status: "COMPLETED",
          completedAt: new Date(),
        }),
        ...(input.status === "COMPLETED" && !existing.completedAt && {
          completedAt: new Date(),
        }),
      },
      include: {
        feedbackLinks: true,
        sourceCycle: { select: { id: true, name: true } },
      },
    });

    // before → after diff 로그
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    if (input.title != null && input.title !== existing.title) {
      before.title = existing.title; after.title = input.title;
    }
    if (input.description !== undefined && input.description !== existing.description) {
      before.description = existing.description; after.description = input.description;
    }
    if (input.progress != null && input.progress !== existing.progress) {
      before.progress = existing.progress; after.progress = Math.min(input.progress, 100);
    }
    if (input.status != null && input.status !== existing.status) {
      before.status = existing.status; after.status = input.status;
    }
    if (input.targetDate !== undefined) {
      before.targetDate = existing.targetDate?.toISOString() ?? null;
      after.targetDate = input.targetDate ?? null;
    }

    await auditLogService.log({
      action: "UPDATE",
      entityType: "DEVELOPMENT_GOAL",
      entityId: id,
      userId,
      changes: { before, after },
      metadata: { ownerId: existing.ownerId },
    });

    // 자동 완료 시 별도 STATUS_CHANGE 로그
    if (autoCompleted) {
      await auditLogService.log({
        action: "STATUS_CHANGE",
        entityType: "DEVELOPMENT_GOAL",
        entityId: id,
        userId,
        changes: { before: { status: existing.status }, after: { status: "COMPLETED" } },
        metadata: {
          reason: "progress_100",
          ownerId: existing.ownerId,
          completedAt: new Date().toISOString(),
        },
      });
    }

    return goal;
  },

  async delete(id: string, userId: string) {
    // 삭제 전 스냅샷 보존
    const existing = await prisma.developmentGoal.findUnique({
      where: { id },
      include: { feedbackLinks: { select: { sessionResponseId: true } } },
    });

    await prisma.developmentGoal.delete({ where: { id } });

    await auditLogService.log({
      action: "DELETE",
      entityType: "DEVELOPMENT_GOAL",
      entityId: id,
      userId,
      changes: existing ? {
        title: existing.title,
        description: existing.description,
        status: existing.status,
        progress: existing.progress,
        sourceType: existing.sourceType,
        sourceCycleId: existing.sourceCycleId,
      } : undefined,
      metadata: {
        ownerId: existing?.ownerId,
        linkedFeedbacks: existing?.feedbackLinks ?? [],
        deletedAt: new Date().toISOString(),
      },
    });
  },

  async linkFeedback(goalId: string, feedbackId: { sessionResponseId?: string }, userId?: string) {
    const link = await prisma.developmentGoalFeedback.create({
      data: {
        developmentGoalId: goalId,
        sessionResponseId: feedbackId.sessionResponseId ?? null,
      },
    });

    await auditLogService.log({
      action: "UPDATE",
      entityType: "DEVELOPMENT_GOAL",
      entityId: goalId,
      userId: userId ?? null,
      changes: {
        linkedFeedback: {
          sessionResponseId: feedbackId.sessionResponseId ?? null,
        },
      },
      metadata: { action: "LINK_FEEDBACK", linkId: link.id },
    });

    return link;
  },

  async getDevelopmentContext(userId: string) {
    // 세션 기반 피드백에서 받은 피드백 조회
    const sessionFeedbacks = await prisma.feedbackSessionResponse.findMany({
      where: { target: { userId } },
      select: {
        id: true,
        content: true,
        category: true,
        createdAt: true,
        author: { select: { name: true } },
        target: {
          select: {
            session: { select: { mode: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const [activeGoals, latestCompletedCycle] = await Promise.all([
      prisma.developmentGoal.findMany({
        where: { ownerId: userId, status: "ACTIVE" },
        include: {
          feedbackLinks: true,
          sourceCycle: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.reviewCycle.findFirst({
        where: {
          status: "COMPLETED",
          reviews: { some: { targetId: userId, status: "SUBMITTED" } },
        },
        orderBy: { endDate: "desc" },
        include: {
          reviews: {
            where: { targetId: userId, status: "SUBMITTED" },
            select: { overallRating: true, responses: { select: { rating: true } } },
          },
        },
      }),
    ]);

    const strengths = sessionFeedbacks
      .filter((f) => f.category === "STRENGTH")
      .map((f) => ({
        content: f.content,
        author: f.target.session.mode === "NAMED" ? f.author?.name ?? null : null,
      }));

    const improvements = sessionFeedbacks
      .filter((f) => f.category === "IMPROVEMENT")
      .map((f) => ({
        content: f.content,
        author: f.target.session.mode === "NAMED" ? f.author?.name ?? null : null,
      }));

    let previousCycleSummary = null;
    if (latestCompletedCycle) {
      const reviews = latestCompletedCycle.reviews;
      const ratings = reviews.map((r) => r.overallRating).filter((r): r is number => r != null);
      const overallScore = ratings.length > 0
        ? parseFloat((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2))
        : null;

      previousCycleSummary = {
        cycleId: latestCompletedCycle.id,
        cycleName: latestCompletedCycle.name,
        overallScore,
        reviewCount: reviews.length,
      };
    }

    return {
      previousFeedback: {
        strengths: strengths.slice(0, 5),
        improvements: improvements.slice(0, 5),
      },
      activeGoals: activeGoals.map((g) => ({
        id: g.id,
        title: g.title,
        progress: g.progress,
        sourceType: g.sourceType,
        linkedFeedbackCount: g.feedbackLinks.length,
        sourceCycleName: g.sourceCycle?.name ?? null,
      })),
      previousCycleSummary,
    };
  },
};
