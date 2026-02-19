"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScoreTrendData {
  cycle: string;
  avgScore: number;
  date: string;
}

interface ScoreTrendChartProps {
  data: ScoreTrendData[];
}

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">평가 점수 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">아직 평가 데이터가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">평가 점수 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="cycle" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
              }}
              formatter={(value) => [`${Number(value).toFixed(2)}점`, "평균 점수"]}
            />
            <Line
              type="monotone"
              dataKey="avgScore"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
