import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logger";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export interface ReviewSummaryContent {
  strengths: string[];
  improvements: string[];
  overall: string;
}

interface ReviewInput {
  reviewType: string;
  overallRating: number | null;
  overallComment: string | null;
  responses: {
    criterionName: string;
    rating: number | null;
    comment: string | null;
    textValue: string | null;
  }[];
}

export async function generateReviewSummary(
  reviews: ReviewInput[]
): Promise<ReviewSummaryContent | null> {
  if (!anthropic) {
    logger.debug("ANTHROPIC_API_KEY 미설정 - AI 요약 건너뜀");
    return null;
  }

  if (reviews.length === 0) {
    return null;
  }

  const reviewTexts = reviews
    .map((r, i) => {
      const lines = [`[평가 ${i + 1}] 유형: ${r.reviewType}, 종합점수: ${r.overallRating ?? "없음"}`];
      if (r.overallComment) lines.push(`종합의견: ${r.overallComment}`);
      for (const resp of r.responses) {
        const parts = [`  - ${resp.criterionName}`];
        if (resp.rating != null) parts.push(`(${resp.rating}점)`);
        if (resp.comment) parts.push(`: ${resp.comment}`);
        if (resp.textValue) parts.push(`: ${resp.textValue}`);
        lines.push(parts.join(""));
      }
      return lines.join("\n");
    })
    .join("\n\n");

  const prompt = `다음은 한 직원에 대한 360도 다면평가 결과입니다. 총 ${reviews.length}건의 평가를 분석하여 요약해주세요.

${reviewTexts}

위 평가 결과를 분석하여 아래 JSON 형식으로 응답해주세요. 한국어로 작성하고, 각 항목은 구체적이고 실행 가능한 내용으로 작성합니다.

{
  "strengths": ["강점1", "강점2", "강점3"],
  "improvements": ["개선영역1", "개선영역2"],
  "overall": "전체적인 인상 요약 (2-3문장)"
}

JSON만 응답하세요.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed: ReviewSummaryContent = JSON.parse(text);

    if (!parsed.strengths || !parsed.improvements || !parsed.overall) {
      throw new Error("응답 형식이 올바르지 않습니다.");
    }

    return parsed;
  } catch (error) {
    logger.error("AI 요약 생성 실패", { error: String(error) });
    return null;
  }
}
