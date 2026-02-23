import { describe, it, expect, vi, beforeEach } from "vitest";
import { reviewService } from "@/lib/services/review.service";

vi.mock("@/lib/prisma", () => ({
  default: {
    reviewCycle: { create: vi.fn(), update: vi.fn() },
    reviewAssignment: { createMany: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    review: { update: vi.fn(), findMany: vi.fn() },
    reviewResponse: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/services/notification.service", () => ({
  notificationService: {
    create: vi.fn(),
    createMany: vi.fn(),
  },
}));

vi.mock("@/lib/services/audit-log.service", () => ({
  auditLogService: {
    log: vi.fn(),
  },
}));

import prisma from "@/lib/prisma";
import { notificationService } from "@/lib/services/notification.service";

describe("ReviewService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCycle", () => {
    it("평가 주기를 생성한다", async () => {
      const data = { name: "2024 Q1", startDate: new Date(), endDate: new Date() };
      vi.mocked(prisma.reviewCycle.create).mockResolvedValue({ id: "cycle-1", ...data } as any);

      const result = await reviewService.createCycle(data);
      expect(prisma.reviewCycle.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: "2024 Q1" }),
      });
      expect(result.id).toBe("cycle-1");
    });
  });

  describe("updateCycleStatus", () => {
    it("ACTIVE로 변경 시 알림을 전송한다", async () => {
      vi.mocked(prisma.reviewCycle.update).mockResolvedValue({
        id: "cycle-1",
        name: "2024 Q1",
        assignments: [
          { reviewerId: "user-1", reviewer: { name: "리뷰어1" } },
          { reviewerId: "user-2", reviewer: { name: "리뷰어2" } },
        ],
      } as any);

      await reviewService.updateCycleStatus("cycle-1", "ACTIVE" as any);

      expect(notificationService.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: "user-1", type: "REVIEW_REQUESTED" }),
          expect.objectContaining({ userId: "user-2", type: "REVIEW_REQUESTED" }),
        ])
      );
    });

    it("ACTIVE가 아닌 상태 변경 시 알림을 보내지 않는다", async () => {
      vi.mocked(prisma.reviewCycle.update).mockResolvedValue({ id: "cycle-1", assignments: [] } as any);

      await reviewService.updateCycleStatus("cycle-1", "COMPLETED" as any);
      expect(notificationService.createMany).not.toHaveBeenCalled();
    });
  });

  describe("submitReview", () => {
    it("평가를 제출하고 대상자에게 알림을 보낸다", async () => {
      vi.mocked(prisma.reviewResponse.findMany).mockResolvedValue([
        { rating: 4 },
        { rating: 5 },
      ] as any);
      vi.mocked(prisma.review.update).mockResolvedValue({
        id: "review-1",
        assignmentId: "assign-1",
        authorId: "user-1",
        targetId: "user-2",
        target: { name: "대상자" },
        author: { name: "작성자" },
        cycle: { name: "2024 Q1" },
        cycleId: "cycle-1",
      } as any);
      vi.mocked(prisma.reviewAssignment.update).mockResolvedValue({} as any);

      await reviewService.submitReview("review-1");

      expect(prisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "review-1" },
          data: { status: "SUBMITTED", overallRating: 4.5 },
        })
      );
      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-2", type: "REVIEW_SUBMITTED" })
      );
    });

    it("RATING 응답이 없으면 overallRating을 null로 설정한다", async () => {
      vi.mocked(prisma.reviewResponse.findMany).mockResolvedValue([
        { rating: null },
      ] as any);
      vi.mocked(prisma.review.update).mockResolvedValue({
        id: "review-1",
        assignmentId: "assign-1",
        authorId: "user-1",
        targetId: "user-2",
        target: { name: "대상자" },
        author: { name: "작성자" },
        cycle: { name: "2024 Q1" },
        cycleId: "cycle-1",
      } as any);
      vi.mocked(prisma.reviewAssignment.update).mockResolvedValue({} as any);

      await reviewService.submitReview("review-1");

      expect(prisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "SUBMITTED", overallRating: null },
        })
      );
    });
  });

  describe("getReviewResults", () => {
    it("제출된 평가 결과를 조회한다", async () => {
      vi.mocked(prisma.review.findMany).mockResolvedValue([{ id: "r1" }] as any);

      const results = await reviewService.getReviewResults("cycle-1", "user-1");
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cycleId: "cycle-1", targetId: "user-1", status: "SUBMITTED" },
        })
      );
      expect(results).toHaveLength(1);
    });
  });
});
