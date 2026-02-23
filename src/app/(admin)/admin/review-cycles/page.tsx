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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ClipboardCheck, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const STATUS_FILTERS: FilterConfig[] = [
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
];

export default function AdminReviewCyclesPage() {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const { data: cycles, isLoading } = useQuery({
    queryKey: ["review-cycles"],
    queryFn: () => api.get<any[]>("/review-cycles"),
  });

  const filteredCycles = useMemo(() => {
    if (!cycles) return [];
    return cycles.filter((cycle: any) => {
      if (filterValues.status && cycle.status !== filterValues.status) return false;
      return true;
    });
  }, [cycles, filterValues]);

  if (isLoading) return <LoadingState rows={4} />;

  return (
    <div>
      <PageHeader title="평가 주기 관리" description="평가 주기를 생성하고 배정을 관리합니다.">
        <Button asChild>
          <Link href="/admin/review-cycles/new">
            <Plus className="mr-2 h-4 w-4" />
            새 평가 주기
          </Link>
        </Button>
      </PageHeader>

      {cycles && cycles.length > 0 && (
        <div className="mb-4">
          <DataTableFilters
            filters={STATUS_FILTERS}
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

      {!filteredCycles?.length ? (
        <EmptyState
          icon={<ClipboardCheck className="h-12 w-12" />}
          title="평가 주기가 없습니다"
          description="새 평가 주기를 생성하여 팀원 평가를 시작하세요."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCycles.map((cycle: any) => (
            <Link key={cycle.id} href={`/reviews/${cycle.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{cycle.name}</CardTitle>
                    <StatusBadge status={cycle.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  {cycle.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {cycle.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(cycle.startDate), "yyyy/M/d", { locale: ko })} ~{" "}
                      {format(new Date(cycle.endDate), "yyyy/M/d", { locale: ko })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {cycle._count?.assignments ?? 0}명
                    </span>
                  </div>
                  {cycle.template && (
                    <p className="text-xs text-muted-foreground mt-2">
                      템플릿: {cycle.template.name}
                    </p>
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
