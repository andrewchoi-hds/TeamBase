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
  self: "#6366f1",
  peer: "#22c55e",
  upward: "#f59e0b",
  downward: "#ef4444",
};

const LABELS: Record<string, string> = {
  self: "자기평가",
  peer: "동료평가",
  upward: "상향평가",
  downward: "하향평가",
};

export function ReviewRadarChart({ data }: ReviewRadarChartProps) {
  if (!data.length) return null;

  // 실제 데이터가 있는 타입만 표시
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
            <PolarGrid />
            <PolarAngleAxis dataKey="category" className="text-xs" />
            <PolarRadiusAxis angle={90} domain={[0, 5]} tickCount={6} />
            {activeTypes.map(([key, color]) => (
              <Radar
                key={key}
                name={LABELS[key]}
                dataKey={key}
                stroke={color}
                fill={color}
                fillOpacity={0.1}
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
