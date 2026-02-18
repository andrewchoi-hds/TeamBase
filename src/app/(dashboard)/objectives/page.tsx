"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target } from "lucide-react";
import { format } from "date-fns";

const levelLabels: Record<string, string> = { COMPANY: "전사", TEAM: "팀", INDIVIDUAL: "개인" };

export default function ObjectivesPage() {
  const { data: objectives, isLoading } = useQuery({
    queryKey: ["objectives"],
    queryFn: () => api.get<any[]>("/objectives"),
  });

  if (isLoading) return <LoadingState rows={4} />;

  return (
    <div>
      <PageHeader title="목표 (OKR)" description="목표와 핵심 결과를 관리하세요.">
        <Button asChild>
          <Link href="/objectives/new"><Plus className="mr-2 h-4 w-4" />새 목표</Link>
        </Button>
      </PageHeader>

      {!objectives?.length ? (
        <EmptyState icon={<Target className="h-12 w-12" />} title="목표가 없습니다" description="새 목표를 설정하여 OKR을 시작하세요." />
      ) : (
        <div className="space-y-4">
          {objectives.map((obj: any) => (
            <Link key={obj.id} href={`/objectives/${obj.id}`}>
              <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{levelLabels[obj.level]}</Badge>
                        <StatusBadge status={obj.status} />
                      </div>
                      <h3 className="font-semibold">{obj.title}</h3>
                      <p className="text-sm text-muted-foreground">{obj.owner.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{Math.round(obj.progress)}%</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(obj.startDate), "M/d")} ~ {format(new Date(obj.endDate), "M/d")}
                      </p>
                    </div>
                  </div>
                  <Progress value={obj.progress} className="h-2 mb-2" />
                  {obj.keyResults?.length > 0 && (
                    <div className="space-y-1 mt-3">
                      {obj.keyResults.map((kr: any) => (
                        <div key={kr.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground truncate flex-1 mr-2">{kr.title}</span>
                          <span className="font-medium">{Math.round(kr.progress)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
