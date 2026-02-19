export interface ReviewData {
  id: string;
  overallRating: number | null;
  overallComment: string | null;
  assignment: { reviewType: string };
  author: { id: string; name: string };
  responses: {
    rating: number;
    comment: string | null;
    criterion: {
      id: string;
      name: string;
      category: { id: string; name: string };
    };
  }[];
}

export interface CategoryScore {
  categoryId: string;
  categoryName: string;
  scores: Record<string, number>; // reviewType -> average
  overall: number;
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
  byType: Record<string, { count: number; avgRating: number }>;
  categoryScores: CategoryScore[];
  radarData: { category: string; self: number; peer: number; upward: number; downward: number }[];
  gapAnalysis: CriterionScore[];
  strengths: CriterionScore[];
  weaknesses: CriterionScore[];
}

export function aggregateReviewData(reviews: ReviewData[]): AggregatedReport {
  if (reviews.length === 0) {
    return {
      targetName: "",
      totalReviews: 0,
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
    if (r.overallRating != null) byType[type].ratings.push(r.overallRating);
  });

  const byTypeResult: Record<string, { count: number; avgRating: number }> = {};
  for (const [type, data] of Object.entries(byType)) {
    byTypeResult[type] = {
      count: data.count,
      avgRating: data.ratings.length ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length : 0,
    };
  }

  // Category scores by review type
  const catMap: Record<string, Record<string, number[]>> = {};
  const catNames: Record<string, string> = {};

  reviews.forEach((r) => {
    const type = r.assignment.reviewType;
    r.responses.forEach((resp) => {
      const catId = resp.criterion.category.id;
      catNames[catId] = resp.criterion.category.name;
      if (!catMap[catId]) catMap[catId] = {};
      if (!catMap[catId][type]) catMap[catId][type] = [];
      catMap[catId][type].push(resp.rating);
    });
  });

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

  // Per criterion: self vs others gap
  const critMap: Record<string, { selfRatings: number[]; othersRatings: number[]; name: string; catName: string }> = {};

  reviews.forEach((r) => {
    const isSelf = r.assignment.reviewType === "SELF";
    r.responses.forEach((resp) => {
      const critId = resp.criterion.id;
      if (!critMap[critId]) {
        critMap[critId] = { selfRatings: [], othersRatings: [], name: resp.criterion.name, catName: resp.criterion.category.name };
      }
      if (isSelf) {
        critMap[critId].selfRatings.push(resp.rating);
      } else {
        critMap[critId].othersRatings.push(resp.rating);
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
  const allCriterionAvg = criterionScores.map((c) => ({
    ...c,
    avgScore: (c.selfScore + c.othersScore) / (c.selfScore && c.othersScore ? 2 : 1),
  }));

  const sorted = [...allCriterionAvg].sort((a, b) => b.avgScore - a.avgScore);
  const strengths = sorted.slice(0, 3);
  const weaknesses = sorted.slice(-3).reverse();

  return {
    targetName: "",
    totalReviews: reviews.length,
    byType: byTypeResult,
    categoryScores,
    radarData,
    gapAnalysis,
    strengths,
    weaknesses,
  };
}
