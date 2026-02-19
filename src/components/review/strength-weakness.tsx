"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { CriterionScore } from "@/lib/utils/review-aggregation";

interface StrengthWeaknessProps {
  strengths: CriterionScore[];
  weaknesses: CriterionScore[];
}

export function StrengthWeakness({ strengths, weaknesses }: StrengthWeaknessProps) {
  if (!strengths.length && !weaknesses.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
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
                    <span className="text-sm font-bold text-green-600 w-5">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{item.criterionName}</p>
                      <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className={`h-2 w-3 rounded-sm ${n <= Math.round(avg) ? "bg-green-500" : "bg-muted"}`} />
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
            <TrendingDown className="h-4 w-4 text-orange-600" />
            개선 영역 (하위 3개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weaknesses.map((item, i) => {
              const avg = item.othersScore || item.selfScore;
              return (
                <div key={item.criterionId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-orange-600 w-5">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{item.criterionName}</p>
                      <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className={`h-2 w-3 rounded-sm ${n <= Math.round(avg) ? "bg-orange-400" : "bg-muted"}`} />
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
    </div>
  );
}
