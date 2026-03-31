"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface TeamAnalyticsData {
  departmentScores: { name: string; avgScore: number; count: number }[];
  gradeDistribution: { grade: string; count: number }[];
  completionTrend: { cycleName: string; endDate: string; completionRate: number; total: number; submitted: number }[];
  latestCycleName?: string;
}

const GRADE_COLORS: Record<string, string> = {
  S: "hsl(var(--chart-5))",
  A: "hsl(var(--chart-1))",
  B: "hsl(var(--chart-2))",
  C: "hsl(var(--chart-3))",
  D: "hsl(var(--chart-4))",
};

export function TeamAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["team-analytics"],
    queryFn: () => api.get<TeamAnalyticsData>("/dashboard/team/analytics"),
  });

  if (isLoading) return <LoadingState rows={3} />;
  if (!data) return null;

  const hasData = data.departmentScores.length > 0 || data.completionTrend.length > 0;
  if (!hasData) {
    return <EmptyState title="분석 데이터 없음" description="완료된 평가 주기가 없습니다." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* 부서별 평균 점수 */}
        {data.departmentScores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">부서별 평균 점수</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.departmentScores} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value) => [Number(value).toFixed(2), "평균 점수"]}
                  />
                  <Bar dataKey="avgScore" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 등급 분포 */}
        {data.gradeDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                등급 분포
                {data.latestCycleName && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({data.latestCycleName})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="grade" tick={{ fontSize: 14, fontWeight: "bold" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value) => [`${value}명`, "인원"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.gradeDistribution.map((entry) => (
                      <Cell key={entry.grade} fill={GRADE_COLORS[entry.grade] ?? "hsl(var(--chart-1))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 완료율 추이 */}
      {data.completionTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">주기별 완료율 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.completionTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="cycleName"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value, _name, props) => [
                    `${value}% (${(props as any).payload.submitted}/${(props as any).payload.total})`,
                    "완료율",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="completionRate"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
