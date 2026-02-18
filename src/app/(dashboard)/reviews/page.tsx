"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { RoleGate } from "@/components/common/role-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ClipboardCheck, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function ReviewsPage() {
  const { data: _session } = useSession();
  const { data: cycles, isLoading } = useQuery({
    queryKey: ["review-cycles"],
    queryFn: () => api.get<any[]>("/review-cycles"),
  });

  if (isLoading) return <LoadingState rows={4} />;

  return (
    <div>
      <PageHeader title="평가" description="평가 주기를 관리하고 평가를 작성하세요.">
        <RoleGate roles={["ADMIN", "MANAGER"]}>
          <Button asChild>
            <Link href="/reviews/new">
              <Plus className="mr-2 h-4 w-4" />
              새 평가 주기
            </Link>
          </Button>
        </RoleGate>
      </PageHeader>

      {!cycles?.length ? (
        <EmptyState
          icon={<ClipboardCheck className="h-12 w-12" />}
          title="평가 주기가 없습니다"
          description="새 평가 주기를 생성하여 팀원 평가를 시작하세요."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cycles.map((cycle: any) => (
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
                      {format(new Date(cycle.startDate), "M/d", { locale: ko })} ~{" "}
                      {format(new Date(cycle.endDate), "M/d", { locale: ko })}
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
