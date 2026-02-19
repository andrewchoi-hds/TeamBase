import { scoreToGrade } from "@/lib/utils/grade-mapping";

interface GradeBadgeProps {
  score: number;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

export function GradeBadge({ score, showScore = true, size = "md" }: GradeBadgeProps) {
  const gradeInfo = scoreToGrade(score);

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} ${gradeInfo.bgColor} ${gradeInfo.textColor} rounded-full flex items-center justify-center font-bold`}
      >
        {gradeInfo.grade}
      </div>
      {showScore && (
        <span className="text-sm text-muted-foreground">{score.toFixed(1)}점</span>
      )}
    </div>
  );
}
