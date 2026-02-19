"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CriterionScore } from "@/lib/utils/review-aggregation";

interface GapAnalysisProps {
  data: CriterionScore[];
}

export function GapAnalysis({ data }: GapAnalysisProps) {
  if (!data.length) return null;

  // 상위 5개만 표시
  const topGaps = data.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">갭 분석 (자기평가 vs 타인평가)</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">
          양수: 자기평가가 높음 / 음수: 타인평가가 높음
        </p>
        <div className="space-y-3">
          {topGaps.map((item) => {
            const absGap = Math.abs(item.gap);
            const isPositive = item.gap > 0;
            return (
              <div key={item.criterionId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{item.criterionName}</span>
                    <span className="text-xs text-muted-foreground ml-2">{item.categoryName}</span>
                  </div>
                  <span className={cn(
                    "font-medium",
                    isPositive ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400"
                  )}>
                    {isPositive ? "+" : ""}{item.gap.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-px h-full bg-border" style={{ marginLeft: "50%" }} />
                    </div>
                    <div
                      className={cn(
                        "h-full rounded-full absolute top-0",
                        isPositive ? "bg-orange-400 dark:bg-orange-500 right-1/2" : "bg-blue-400 dark:bg-blue-500 left-1/2"
                      )}
                      style={{
                        width: `${Math.min(absGap / 5 * 50, 50)}%`,
                        ...(isPositive
                          ? { right: "50%", borderTopRightRadius: 0, borderBottomRightRadius: 0 }
                          : { left: "50%", borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }
                        ),
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>자기: {item.selfScore.toFixed(1)}</span>
                  <span>타인: {item.othersScore.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
