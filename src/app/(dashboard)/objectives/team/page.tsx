"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const levelLabels: Record<string, string> = { COMPANY: "전사", TEAM: "팀", INDIVIDUAL: "개인" };

export default function TeamObjectivesPage() {
  const { data: objectives, isLoading } = useQuery({
    queryKey: ["objectives", "all"],
    queryFn: () => api.get<any[]>("/objectives?level=TEAM"),
  });

  if (isLoading) return <LoadingState rows={4} />;

  return (
    <div>
      <PageHeader title="팀 목표" description="팀 수준의 OKR을 확인하세요." />
      <div className="space-y-3">
        {objectives?.map((obj: any) => (
          <Link key={obj.id} href={`/objectives/${obj.id}`}>
            <Card className="hover:shadow-sm transition-shadow cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{obj.title}</h3>
                    <p className="text-sm text-muted-foreground">{obj.owner.name}</p>
                  </div>
                  <span className="text-xl font-bold">{Math.round(obj.progress)}%</span>
                </div>
                <Progress value={obj.progress} className="h-2" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
