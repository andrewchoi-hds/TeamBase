import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
  rows?: number;
  variant?: "list" | "cards" | "detail";
}

export function LoadingState({ className, rows = 3, variant = "list" }: LoadingStateProps) {
  if (variant === "cards") {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-24 mt-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="rounded-xl border bg-card p-6 space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
