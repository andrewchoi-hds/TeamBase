import { createHash, randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { FeedbackCategory } from "@prisma/client";

const FEEDBACK_SALT = process.env.FEEDBACK_SALT;
if (!FEEDBACK_SALT) {
  throw new Error("FEEDBACK_SALT 환경변수가 설정되지 않았습니다.");
}
const MIN_FEEDBACK_COUNT = 3;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function doubleHash(token: string): string {
  const firstHash = hashToken(token);
  return createHash("sha256").update(firstHash + FEEDBACK_SALT).digest("hex");
}

function roundToDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export const anonymousFeedbackService = {
  async createTokens(targetId: string, count: number, expiresInDays = 30) {
    const tokens: string[] = [];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    for (let i = 0; i < count; i++) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);

      await prisma.anonymousFeedbackToken.create({
        data: { tokenHash, targetId, expiresAt },
      });

      tokens.push(rawToken);
    }

    return tokens;
  },

  async validateToken(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const token = await prisma.anonymousFeedbackToken.findUnique({
      where: { tokenHash },
    });

    if (!token) return { valid: false, error: "유효하지 않은 토큰입니다." } as const;
    if (token.isUsed) return { valid: false, error: "이미 사용된 토큰입니다." } as const;
    if (token.expiresAt < new Date()) return { valid: false, error: "만료된 토큰입니다." } as const;

    return { valid: true, targetId: token.targetId, tokenId: token.id } as const;
  },

  async submit(rawToken: string, content: string, category: FeedbackCategory = "GENERAL") {
    const tokenHash = hashToken(rawToken);
    const submissionToken = doubleHash(rawToken);
    const roundedDate = roundToDay(new Date());

    return prisma.$transaction(async (tx) => {
      // 트랜잭션 내에서 토큰을 검증하고 즉시 사용 처리 (TOCTOU 방지)
      const token = await tx.anonymousFeedbackToken.findUnique({
        where: { tokenHash },
      });

      if (!token) throw new Error("유효하지 않은 토큰입니다.");
      if (token.isUsed) throw new Error("이미 사용된 토큰입니다.");
      if (token.expiresAt < new Date()) throw new Error("만료된 토큰입니다.");

      await tx.anonymousFeedbackToken.update({
        where: { id: token.id },
        data: { isUsed: true },
      });

      return tx.anonymousFeedback.create({
        data: {
          targetId: token.targetId,
          content,
          category,
          submissionToken,
          createdAt: roundedDate,
        },
      });
    });
  },

  async getByTarget(targetId: string) {
    const count = await prisma.anonymousFeedback.count({ where: { targetId } });

    // k-anonymity: only reveal if >= MIN_FEEDBACK_COUNT
    if (count < MIN_FEEDBACK_COUNT) {
      return { feedbacks: [], count, isVisible: false, minRequired: MIN_FEEDBACK_COUNT };
    }

    const feedbacks = await prisma.anonymousFeedback.findMany({
      where: { targetId },
      select: { id: true, category: true, content: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return { feedbacks, count, isVisible: true, minRequired: MIN_FEEDBACK_COUNT };
  },
};
