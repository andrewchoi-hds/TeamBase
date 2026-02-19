"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OkrComparisonData {
  name: string;
  progress: number;
}

interface OkrComparisonChartProps {
  data: OkrComparisonData[];
}

function getBarColor(progress: number): string {
  if (progress >= 70) return "hsl(142, 76%, 36%)";
  if (progress >= 40) return "hsl(38, 92%, 50%)";
  return "hsl(346, 77%, 50%)";
}

export function OkrComparisonChart({ data }: OkrComparisonChartProps) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">팀원별 OKR 달성률</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">팀원 OKR 데이터가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">팀원별 OKR 달성률</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
              }}
              formatter={(value) => [`${value}%`, "달성률"]}
            />
            <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.progress)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
