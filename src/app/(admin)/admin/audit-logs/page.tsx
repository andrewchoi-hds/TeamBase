"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, FileText, Filter } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "생성",
  UPDATE: "수정",
  DELETE: "삭제",
  SUBMIT: "제출",
  REOPEN: "재오픈",
  STATUS_CHANGE: "상태 변경",
  AUTO_CLOSE: "자동 종료",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  REVIEW: "평가",
  REVIEW_ASSIGNMENT: "평가 배정",
  REVIEW_CYCLE: "평가 주기",
  REVIEW_TEMPLATE: "평가 템플릿",
  DEVELOPMENT_GOAL: "개발 목표",
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  SUBMIT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  REOPEN: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  STATUS_CHANGE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  AUTO_CLOSE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const PAGE_SIZE = 30;

export default function AuditLogsPage() {
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const queryParams = new URLSearchParams();
  if (actionFilter !== "all") queryParams.set("action", actionFilter);
  if (entityTypeFilter !== "all") queryParams.set("entityType", entityTypeFilter);
  queryParams.set("limit", String(PAGE_SIZE));
  queryParams.set("offset", String(page * PAGE_SIZE));

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", actionFilter, entityTypeFilter, page],
    queryFn: () =>
      api.get<{ logs: any[]; total: number }>(
        `/audit-logs?${queryParams.toString()}`
      ),
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const resetFilters = () => {
    setActionFilter("all");
    setEntityTypeFilter("all");
    setPage(0);
  };

  return (
    <div>
      <PageHeader
        title="감사 로그"
        description="시스템 전체 활동 이력을 조회합니다."
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={actionFilter}
          onValueChange={(v) => { setActionFilter(v); setPage(0); }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="액션 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 액션</SelectItem>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={entityTypeFilter}
          onValueChange={(v) => { setEntityTypeFilter(v); setPage(0); }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="유형 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(actionFilter !== "all" || entityTypeFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            초기화
          </Button>
        )}
        <span className="ml-auto text-sm text-muted-foreground">
          총 {total}건
        </span>
      </div>

      {/* Log List */}
      {isLoading ? (
        <LoadingState rows={8} />
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">감사 로그가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${ACTION_COLORS[log.action] ?? ""}`}
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {ENTITY_TYPE_LABELS[log.entityType] ?? log.entityType}
                      </Badge>
                      {log.user && (
                        <span className="text-sm font-medium">{log.user.name}</span>
                      )}
                    </div>
                    {log.changes && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {formatChanges(log.changes)}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                    {format(new Date(log.createdAt), "M/d HH:mm", { locale: ko })}
                  </time>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function formatChanges(changes: Record<string, unknown>): string {
  const entries = Object.entries(changes);
  if (entries.length === 0) return "";
  return entries
    .map(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        const obj = value as Record<string, unknown>;
        if ("from" in obj && "to" in obj) return `${key}: ${obj.from} → ${obj.to}`;
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${value}`;
    })
    .join(", ");
}
