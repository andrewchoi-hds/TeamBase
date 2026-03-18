"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, ChevronDown, ChevronRight, Trash2, RotateCcw, Users, Tag, User } from "lucide-react";
import { reviewTypeLabels, type ReviewType, type AssignmentStatus } from "@/lib/constants/review";
import type { Assignment } from "@/types";

type GroupBy = "reviewer" | "target" | "type";

interface AssignmentListProps {
  assignments: Assignment[];
  cycleId: string;
  cycleStatus: string;
  onDelete?: (assignmentId: string) => void;
  onReopen?: (assignmentId: string, reason?: string) => void;
  isDeleting?: boolean;
}

export function AssignmentList({
  assignments,
  cycleId,
  cycleStatus,
  onDelete,
  onReopen,
  isDeleting,
}: AssignmentListProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ReviewType | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<AssignmentStatus | "ALL">("ALL");
  const [groupBy, setGroupBy] = useState<GroupBy>("reviewer");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [reopenReason, setReopenReason] = useState("");

  // 필터링
  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      if (filterType !== "ALL" && a.reviewType !== filterType) return false;
      if (filterStatus !== "ALL" && a.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        const reviewerMatch = a.reviewer.name.toLowerCase().includes(q);
        const targetMatch = a.target.name.toLowerCase().includes(q);
        if (!reviewerMatch && !targetMatch) return false;
      }
      return true;
    });
  }, [assignments, filterType, filterStatus, search]);

  // 상태별/유형별 카운트
  const counts = useMemo(() => {
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const a of assignments) {
      byType[a.reviewType] = (byType[a.reviewType] ?? 0) + 1;
      byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    }
    return { byType, byStatus };
  }, [assignments]);

  // 그룹핑
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: Assignment[] }>();
    for (const a of filtered) {
      let key: string;
      let label: string;
      switch (groupBy) {
        case "reviewer":
          key = a.reviewerId;
          label = a.reviewer.name;
          break;
        case "target":
          key = a.targetId;
          label = a.target.name;
          break;
        case "type":
          key = a.reviewType;
          label = reviewTypeLabels[a.reviewType] ?? a.reviewType;
          break;
      }
      if (!map.has(key)) {
        map.set(key, { label, items: [] });
      }
      map.get(key)!.items.push(a);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].label.localeCompare(b[1].label, "ko"));
  }, [filtered, groupBy]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const groupIcons: Record<GroupBy, React.ReactNode> = {
    reviewer: <User className="h-3.5 w-3.5" />,
    target: <Users className="h-3.5 w-3.5" />,
    type: <Tag className="h-3.5 w-3.5" />,
  };

  return (
    <div className="space-y-4">
      {/* 요약 칩 */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(counts.byType).map(([type, count]) => (
          <Badge
            key={type}
            variant={filterType === type ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => setFilterType(filterType === type ? "ALL" : type as ReviewType)}
          >
            {reviewTypeLabels[type] ?? type} {count}
          </Badge>
        ))}
        <span className="mx-1 border-l h-5 self-center" />
        {Object.entries(counts.byStatus).map(([status, count]) => (
          <Badge
            key={status}
            variant={filterStatus === status ? "default" : "secondary"}
            className="cursor-pointer text-xs"
            onClick={() => setFilterStatus(filterStatus === status ? "ALL" : status as AssignmentStatus)}
          >
            {status === "PENDING" ? "대기" : status === "IN_PROGRESS" ? "진행중" : status === "SUBMITTED" ? "제출" : "취소"} {count}
          </Badge>
        ))}
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reviewer">평가자별</SelectItem>
            <SelectItem value="target">대상자별</SelectItem>
            <SelectItem value="type">유형별</SelectItem>
          </SelectContent>
        </Select>
        {(filterType !== "ALL" || filterStatus !== "ALL" || search) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={() => { setFilterType("ALL"); setFilterStatus("ALL"); setSearch(""); }}
          >
            필터 초기화
          </Button>
        )}
      </div>

      {/* 결과 수 */}
      <p className="text-xs text-muted-foreground">
        {filtered.length === assignments.length
          ? `전체 ${assignments.length}건`
          : `${assignments.length}건 중 ${filtered.length}건 표시`}
        {" · "}{groups.length}개 그룹
      </p>

      {/* 그룹별 리스트 */}
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {assignments.length === 0 ? "배정된 평가가 없습니다." : "검색 결과가 없습니다."}
        </p>
      ) : (
        <div className="space-y-2">
          {groups.map(([key, group]) => {
            const isCollapsed = collapsedGroups.has(key);
            const submittedCount = group.items.filter((a) => a.status === "SUBMITTED").length;

            return (
              <Collapsible key={key} open={!isCollapsed} onOpenChange={() => toggleGroup(key)}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  {groupIcons[groupBy]}
                  <span className="font-medium text-sm">{group.label}</span>
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {submittedCount}/{group.items.length}
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-4 border-l pl-3 space-y-1 mt-1 mb-2">
                    {group.items.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-sm min-w-0">
                          {groupBy !== "reviewer" && (
                            <>
                              <span className="font-medium truncate">{assignment.reviewer.name}</span>
                              <span className="text-muted-foreground shrink-0">→</span>
                            </>
                          )}
                          {groupBy !== "target" && (
                            <span className={groupBy === "reviewer" ? "truncate" : "truncate"}>
                              {groupBy === "reviewer" && <span className="text-muted-foreground mr-1">→</span>}
                              {assignment.target.name}
                            </span>
                          )}
                          {groupBy !== "type" && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {reviewTypeLabels[assignment.reviewType]}
                            </Badge>
                          )}
                          {assignment.review?.overallRating != null && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {assignment.review.overallRating.toFixed(1)}점
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {assignment.status === "SUBMITTED" && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                              <Link href={`/reviews/${cycleId}/results/${assignment.target.id}`}>
                                리포트
                              </Link>
                            </Button>
                          )}
                          <StatusBadge status={assignment.status} />
                          {cycleStatus === "DRAFT" && assignment.status === "PENDING" && onDelete && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={() => onDelete(assignment.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                          {cycleStatus === "ACTIVE" && assignment.status === "SUBMITTED" && onReopen && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                                  <RotateCcw className="h-3 w-3" />
                                  재오픈
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>평가 재오픈</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {assignment.reviewer.name}님의 {assignment.target.name}님에 대한 평가를 재오픈하시겠습니까?
                                    평가자에게 알림이 발송됩니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <Input
                                  placeholder="재오픈 사유 (선택)"
                                  value={reopenReason}
                                  onChange={(e) => setReopenReason(e.target.value)}
                                />
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setReopenReason("")}>취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      onReopen(assignment.id, reopenReason || undefined);
                                      setReopenReason("");
                                    }}
                                  >
                                    재오픈
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
