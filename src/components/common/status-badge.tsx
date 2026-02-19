import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ACTIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  COMPLETED: "bg-sky-50 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  CANCELLED: "bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  IN_PROGRESS: "bg-orange-50 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  SUBMITTED: "bg-violet-50 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  TODO: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  DONE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  SCHEDULED: "bg-sky-50 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
};

const statusLabels: Record<string, string> = {
  DRAFT: "초안",
  ACTIVE: "진행중",
  COMPLETED: "완료",
  CANCELLED: "취소",
  PENDING: "대기",
  IN_PROGRESS: "진행중",
  SUBMITTED: "제출됨",
  TODO: "할일",
  DONE: "완료",
  SCHEDULED: "예정",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium border-0",
        statusStyles[status] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        className
      )}
    >
      {statusLabels[status] ?? status}
    </Badge>
  );
}
