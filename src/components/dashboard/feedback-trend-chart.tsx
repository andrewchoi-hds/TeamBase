"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FeedbackTrendData {
  month: string;
  received: number;
  sent: number;
}

interface FeedbackTrendChartProps {
  data: FeedbackTrendData[];
}

export function FeedbackTrendChart({ data }: FeedbackTrendChartProps) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">월별 피드백 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">피드백 데이터가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">월별 피드백 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="received"
              name="받은 피드백"
              stroke="hsl(24.6, 95%, 53.1%)"
              fill="hsl(24.6, 95%, 53.1%)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="sent"
              name="보낸 피드백"
              stroke="hsl(199, 89%, 48%)"
              fill="hsl(199, 89%, 48%)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
