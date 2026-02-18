import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  IN_PROGRESS: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  SUBMITTED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  TODO: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  DONE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
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
        statusStyles[status] ?? "bg-gray-100 text-gray-800",
        className
      )}
    >
      {statusLabels[status] ?? status}
    </Badge>
  );
}
