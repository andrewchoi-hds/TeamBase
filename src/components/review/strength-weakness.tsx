"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateGoalDialog } from "@/components/development-goal/create-goal-dialog";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { CriterionScore } from "@/lib/utils/review-aggregation";

interface StrengthWeaknessProps {
  strengths: CriterionScore[];
  weaknesses: CriterionScore[];
  cycleId?: string;
  isOwnReport?: boolean;
}

export function StrengthWeakness({ strengths, weaknesses, cycleId, isOwnReport }: StrengthWeaknessProps) {
  if (!strengths.length && !weaknesses.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            강점 (상위 3개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {strengths.map((item, i) => {
              const avg = item.othersScore || item.selfScore;
              return (
                <div key={item.criterionId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400 w-5">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{item.criterionName}</p>
                      <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className={`h-2 w-3 rounded-sm ${n <= Math.round(avg) ? "bg-green-500 dark:bg-green-400" : "bg-muted"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium ml-1">{avg.toFixed(1)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            개선 영역 (하위 3개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weaknesses.map((item, i) => {
              const avg = item.othersScore || item.selfScore;
              return (
                <div key={item.criterionId} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400 w-5 shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.criterionName}</p>
                      <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className={`h-2 w-3 rounded-sm ${n <= Math.round(avg) ? "bg-orange-400 dark:bg-orange-500" : "bg-muted"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium w-7 text-right">{avg.toFixed(1)}</span>
                    {isOwnReport && cycleId && (
                      <CreateGoalDialog
                        sourceType="REVIEW"
                        sourceCycleId={cycleId}
                        defaultTitle={`${item.criterionName} 역량 강화`}
                        variant="icon"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
