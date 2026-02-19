"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RadarChartData {
  category: string;
  self: number;
  peer: number;
  upward: number;
  downward: number;
}

interface ReviewRadarChartProps {
  data: RadarChartData[];
}

const COLORS = {
  self: "hsl(24.6, 95%, 53.1%)",    // orange-500 (primary)
  peer: "hsl(199, 89%, 48%)",        // sky-500
  upward: "hsl(38, 92%, 50%)",       // amber-500
  downward: "hsl(346, 77%, 50%)",    // rose-500
};

const LABELS: Record<string, string> = {
  self: "자기평가",
  peer: "동료평가",
  upward: "상향평가",
  downward: "하향평가",
};

export function ReviewRadarChart({ data }: ReviewRadarChartProps) {
  if (!data.length) return null;

  const activeTypes = Object.entries(COLORS).filter(([key]) =>
    data.some((d) => d[key as keyof RadarChartData] as number > 0)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">카테고리별 평가 비교</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="category" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <PolarRadiusAxis angle={90} domain={[0, 5]} tickCount={6} tick={{ fill: "hsl(var(--muted-foreground))" }} />
            {activeTypes.map(([key, color]) => (
              <Radar
                key={key}
                name={LABELS[key]}
                dataKey={key}
                stroke={color}
                fill={color}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
