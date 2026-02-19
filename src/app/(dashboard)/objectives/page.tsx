"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { DataTableFilters, FilterConfig } from "@/components/common/data-table-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target } from "lucide-react";
import { format } from "date-fns";
import { ExportButton } from "@/components/common/export-button";

const levelLabels: Record<string, string> = { COMPANY: "전사", TEAM: "팀", INDIVIDUAL: "개인" };

const OBJ_FILTERS: FilterConfig[] = [
  {
    key: "status",
    label: "상태",
    type: "select",
    options: [
      { value: "DRAFT", label: "초안" },
      { value: "ACTIVE", label: "진행중" },
      { value: "COMPLETED", label: "완료" },
      { value: "CANCELLED", label: "취소됨" },
    ],
  },
  {
    key: "level",
    label: "레벨",
    type: "select",
    options: [
      { value: "COMPANY", label: "전사" },
      { value: "TEAM", label: "팀" },
      { value: "INDIVIDUAL", label: "개인" },
    ],
  },
];

export default function ObjectivesPage() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const { data: objectives, isLoading } = useQuery({
    queryKey: ["objectives"],
    queryFn: () => api.get<any[]>("/objectives"),
  });

  const filteredObjectives = useMemo(() => {
    if (!objectives) return [];
    return objectives.filter((obj: any) => {
      if (filterValues.status && obj.status !== filterValues.status) return false;
      if (filterValues.level && obj.level !== filterValues.level) return false;
      return true;
    });
  }, [objectives, filterValues]);

  if (isLoading) return <LoadingState rows={4} />;

  return (
    <div>
      <PageHeader title="목표 (OKR)" description="목표와 핵심 결과를 관리하세요.">
        <div className="flex items-center gap-2">
          <ExportButton
            filename="OKR_목표"
            headers={["목표", "레벨", "상태", "담당자", "진행률", "시작일", "종료일"]}
            rows={filteredObjectives.map((obj: any) => [
              obj.title,
              levelLabels[obj.level],
              obj.status,
              obj.owner.name,
              `${Math.round(obj.progress)}%`,
              format(new Date(obj.startDate), "yyyy-MM-dd"),
              format(new Date(obj.endDate), "yyyy-MM-dd"),
            ])}
            disabled={!filteredObjectives.length}
          />
          <Button asChild>
            <Link href="/objectives/new"><Plus className="mr-2 h-4 w-4" />새 목표</Link>
          </Button>
        </div>
      </PageHeader>

      {objectives && objectives.length > 0 && (
        <div className="mb-4">
          <DataTableFilters
            filters={OBJ_FILTERS}
            values={filterValues}
            onChange={(key, value) => setFilterValues((prev) => {
              const next = { ...prev };
              if (value) next[key] = value;
              else delete next[key];
              return next;
            })}
            onReset={() => setFilterValues({})}
          />
        </div>
      )}

      {!filteredObjectives?.length ? (
        <EmptyState icon={<Target className="h-12 w-12" />} title="목표가 없습니다" description="새 목표를 설정하여 OKR을 시작하세요." />
      ) : (
        <div className="space-y-4">
          {filteredObjectives.map((obj: any) => (
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
                        {format(new Date(obj.startDate), "yyyy/M/d")} ~ {format(new Date(obj.endDate), "yyyy/M/d")}
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
