export interface GradeInfo {
  grade: string;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export const DEFAULT_GRADE_SCALE: GradeInfo[] = [
  { grade: "S", label: "탁월", color: "violet", bgColor: "bg-violet-100 dark:bg-violet-900", textColor: "text-violet-700 dark:text-violet-300" },
  { grade: "A", label: "우수", color: "blue", bgColor: "bg-blue-100 dark:bg-blue-900", textColor: "text-blue-700 dark:text-blue-300" },
  { grade: "B", label: "보통", color: "green", bgColor: "bg-green-100 dark:bg-green-900", textColor: "text-green-700 dark:text-green-300" },
  { grade: "C", label: "미흡", color: "yellow", bgColor: "bg-yellow-100 dark:bg-yellow-900", textColor: "text-yellow-700 dark:text-yellow-300" },
  { grade: "D", label: "부진", color: "red", bgColor: "bg-red-100 dark:bg-red-900", textColor: "text-red-700 dark:text-red-300" },
];

export const GRADE_COLORS: Record<string, string> = {
  S: "violet",
  A: "blue",
  B: "green",
  C: "yellow",
  D: "red",
};

export function scoreToGrade(score: number): GradeInfo {
  if (score >= 4.5) return DEFAULT_GRADE_SCALE[0]; // S
  if (score >= 3.5) return DEFAULT_GRADE_SCALE[1]; // A
  if (score >= 2.5) return DEFAULT_GRADE_SCALE[2]; // B
  if (score >= 1.5) return DEFAULT_GRADE_SCALE[3]; // C
  return DEFAULT_GRADE_SCALE[4]; // D
}
