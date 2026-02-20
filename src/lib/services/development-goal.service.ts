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
  feedbackIds?: { identifiedFeedbackId?: string; anonymousFeedbackId?: string }[];
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
                identifiedFeedbackId: fb.identifiedFeedbackId ?? null,
                anonymousFeedbackId: fb.anonymousFeedbackId ?? null,
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
      metadata: { ownerId: input.ownerId, sourceType: input.sourceType ?? "SELF" },
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
            identifiedFeedback: { select: { id: true, content: true, category: true } },
            anonymousFeedback: { select: { id: true, content: true, category: true } },
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
            identifiedFeedback: { select: { id: true, content: true, category: true, authorId: true } },
            anonymousFeedback: { select: { id: true, content: true, category: true } },
          },
        },
        sourceCycle: { select: { id: true, name: true } },
      },
    });
  },

  async update(id: string, input: UpdateGoalInput, userId: string) {
    const existing = await prisma.developmentGoal.findUnique({ where: { id } });
    if (!existing) throw new Error("개선 목표를 찾을 수 없습니다.");

    const autoCompleted = input.progress != null && input.progress >= 100;

    const goal = await prisma.developmentGoal.update({
      where: { id },
      data: {
        ...(input.title != null && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status != null && { status: input.status }),
        ...(input.progress != null && { progress: Math.min(input.progress, 100) }),
        ...(input.targetDate !== undefined && { targetDate: input.targetDate ? new Date(input.targetDate) : null }),
        ...(autoCompleted && existing.status === "ACTIVE" && {
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

    await auditLogService.log({
      action: "UPDATE",
      entityType: "DEVELOPMENT_GOAL",
      entityId: id,
      userId,
      changes: input as unknown as Record<string, unknown>,
    });

    return goal;
  },

  async delete(id: string, userId: string) {
    await prisma.developmentGoal.delete({ where: { id } });

    await auditLogService.log({
      action: "DELETE",
      entityType: "DEVELOPMENT_GOAL",
      entityId: id,
      userId,
    });
  },

  async linkFeedback(goalId: string, feedbackId: { identifiedFeedbackId?: string; anonymousFeedbackId?: string }) {
    return prisma.developmentGoalFeedback.create({
      data: {
        developmentGoalId: goalId,
        identifiedFeedbackId: feedbackId.identifiedFeedbackId ?? null,
        anonymousFeedbackId: feedbackId.anonymousFeedbackId ?? null,
      },
    });
  },

  async getDevelopmentContext(userId: string) {
    const [feedbacks, anonymousFeedbacks, activeGoals, latestCompletedCycle] = await Promise.all([
      prisma.identifiedFeedback.findMany({
        where: { targetId: userId },
        select: { id: true, content: true, category: true, createdAt: true, author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.anonymousFeedback.findMany({
        where: { targetId: userId },
        select: { id: true, content: true, category: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
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

    const strengths = feedbacks
      .filter((f) => f.category === "STRENGTH")
      .map((f) => ({ content: f.content, author: f.author?.name }));

    const improvements = [
      ...feedbacks.filter((f) => f.category === "IMPROVEMENT").map((f) => ({ content: f.content, author: f.author?.name })),
      ...anonymousFeedbacks.filter((f) => f.category === "IMPROVEMENT").map((f) => ({ content: f.content, author: null })),
    ];

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
