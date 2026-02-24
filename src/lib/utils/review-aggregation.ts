export interface ReviewData {
  id: string;
  overallRating: number | null;
  overallComment: string | null;
  assignment: { reviewType: string };
  author: { id: string; name: string };
  responses: {
    rating: number | null;
    comment: string | null;
    textValue?: string | null;
    selectedOptions?: string[] | null;
    criterion: {
      id: string;
      name: string;
      questionType?: string;
      category: { id: string; name: string };
    };
  }[];
}

export interface CategoryScore {
  categoryId: string;
  categoryName: string;
  scores: Record<string, number>; // reviewType -> average
  overall: number;
  weight: number;
}

export interface CriterionScore {
  criterionId: string;
  criterionName: string;
  categoryName: string;
  selfScore: number;
  othersScore: number;
  gap: number;
}

export interface AggregatedReport {
  targetName: string;
  totalReviews: number;
  overallAvgScore: number;
  byType: Record<string, { count: number; avgRating: number }>;
  categoryScores: CategoryScore[];
  radarData: { category: string; self: number; peer: number; upward: number; downward: number }[];
  gapAnalysis: CriterionScore[];
  strengths: CriterionScore[];
  weaknesses: CriterionScore[];
}

/** RATING 유형 응답만 필터 (null rating 제외) */
function ratingResponses(responses: ReviewData["responses"]) {
  return responses.filter((resp) => resp.rating != null);
}

export function aggregateReviewData(
  reviews: ReviewData[],
  categoryWeights?: { categoryId: string; weight: number }[],
): AggregatedReport {
  if (reviews.length === 0) {
    return {
      targetName: "",
      totalReviews: 0,
      overallAvgScore: 0,
      byType: {},
      categoryScores: [],
      radarData: [],
      gapAnalysis: [],
      strengths: [],
      weaknesses: [],
    };
  }

  // By type aggregation
  const byType: Record<string, { ratings: number[]; count: number }> = {};
  reviews.forEach((r) => {
    const type = r.assignment.reviewType;
    if (!byType[type]) byType[type] = { ratings: [], count: 0 };
    byType[type].count++;
    if (r.overallRating != null) {
      byType[type].ratings.push(r.overallRating);
    } else {
      const rated = ratingResponses(r.responses);
      if (rated.length > 0) {
        const avg = rated.reduce((sum, resp) => sum + (resp.rating as number), 0) / rated.length;
        byType[type].ratings.push(avg);
      }
    }
  });

  const byTypeResult: Record<string, { count: number; avgRating: number }> = {};
  for (const [type, data] of Object.entries(byType)) {
    byTypeResult[type] = {
      count: data.count,
      avgRating: data.ratings.length ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length : 0,
    };
  }

  // Category scores by review type (RATING responses only)
  const catMap: Record<string, Record<string, number[]>> = {};
  const catNames: Record<string, string> = {};

  reviews.forEach((r) => {
    const type = r.assignment.reviewType;
    ratingResponses(r.responses).forEach((resp) => {
      const catId = resp.criterion.category.id;
      catNames[catId] = resp.criterion.category.name;
      if (!catMap[catId]) catMap[catId] = {};
      if (!catMap[catId][type]) catMap[catId][type] = [];
      catMap[catId][type].push(resp.rating as number);
    });
  });

  const weightMap: Record<string, number> = {};
  if (categoryWeights) {
    for (const cw of categoryWeights) {
      weightMap[cw.categoryId] = cw.weight;
    }
  }

  const categoryScores: CategoryScore[] = Object.entries(catMap).map(([catId, typeScores]) => {
    const scores: Record<string, number> = {};
    let allRatings: number[] = [];
    for (const [type, ratings] of Object.entries(typeScores)) {
      scores[type] = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      allRatings = allRatings.concat(ratings);
    }
    return {
      categoryId: catId,
      categoryName: catNames[catId],
      scores,
      overall: allRatings.reduce((a, b) => a + b, 0) / allRatings.length,
      weight: weightMap[catId] ?? 1.0,
    };
  });

  // Radar data
  const radarData = categoryScores.map((cat) => ({
    category: cat.categoryName,
    self: cat.scores["SELF"] ?? 0,
    peer: cat.scores["PEER"] ?? 0,
    upward: cat.scores["UPWARD"] ?? 0,
    downward: cat.scores["DOWNWARD"] ?? 0,
  }));

  // Per criterion: self vs others gap (RATING only)
  const critMap: Record<string, { selfRatings: number[]; othersRatings: number[]; name: string; catName: string }> = {};

  reviews.forEach((r) => {
    const isSelf = r.assignment.reviewType === "SELF";
    ratingResponses(r.responses).forEach((resp) => {
      const critId = resp.criterion.id;
      if (!critMap[critId]) {
        critMap[critId] = { selfRatings: [], othersRatings: [], name: resp.criterion.name, catName: resp.criterion.category.name };
      }
      if (isSelf) {
        critMap[critId].selfRatings.push(resp.rating as number);
      } else {
        critMap[critId].othersRatings.push(resp.rating as number);
      }
    });
  });

  const criterionScores: CriterionScore[] = Object.entries(critMap).map(([critId, data]) => {
    const selfScore = data.selfRatings.length ? data.selfRatings.reduce((a, b) => a + b, 0) / data.selfRatings.length : 0;
    const othersScore = data.othersRatings.length ? data.othersRatings.reduce((a, b) => a + b, 0) / data.othersRatings.length : 0;
    return {
      criterionId: critId,
      criterionName: data.name,
      categoryName: data.catName,
      selfScore,
      othersScore,
      gap: selfScore - othersScore,
    };
  });

  // Gap analysis: sorted by absolute gap descending
  const gapAnalysis = [...criterionScores].sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));

  // Overall average per criterion
  const allCriterionAvg = criterionScores.map((c) => {
    const hasSelf = critMap[c.criterionId].selfRatings.length > 0;
    const hasOthers = critMap[c.criterionId].othersRatings.length > 0;
    const divisor = (hasSelf && hasOthers) ? 2 : 1;
    return {
      ...c,
      avgScore: (c.selfScore + c.othersScore) / divisor,
    };
  });

  const sorted = [...allCriterionAvg].sort((a, b) => b.avgScore - a.avgScore);
  const strengths = sorted.slice(0, 3);
  const weaknesses = sorted.slice(-3).reverse();

  // 전체 평균 점수 계산 (overallRating 우선, 없으면 카테고리 가중 평균으로 폴백)
  const overallRatings = reviews
    .filter((r) => r.overallRating != null)
    .map((r) => r.overallRating as number);

  let overallAvgScore: number;
  if (overallRatings.length > 0) {
    overallAvgScore = overallRatings.reduce((a, b) => a + b, 0) / overallRatings.length;
  } else if (categoryWeights && categoryScores.length > 0) {
    // 가중 평균: sum(cat.overall * weight) / sum(weight)
    const totalWeight = categoryScores.reduce((sum, cat) => sum + cat.weight, 0);
    overallAvgScore = totalWeight > 0
      ? categoryScores.reduce((sum, cat) => sum + cat.overall * cat.weight, 0) / totalWeight
      : 0;
  } else {
    const allResponseRatings = reviews.flatMap((r) => ratingResponses(r.responses).map((resp) => resp.rating as number));
    overallAvgScore = allResponseRatings.length > 0
      ? allResponseRatings.reduce((a, b) => a + b, 0) / allResponseRatings.length
      : 0;
  }

  return {
    targetName: "",
    totalReviews: reviews.length,
    overallAvgScore,
    byType: byTypeResult,
    categoryScores,
    radarData,
    gapAnalysis,
    strengths,
    weaknesses,
  };
}
