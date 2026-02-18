"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Quarter {
  label: string;
  key: string;
  startDate: Date;
  endDate: Date;
}

interface QuarterPickerProps {
  year?: number;
  selectedQuarter?: string | null;
  onSelect: (quarter: Quarter) => void;
  className?: string;
}

function getQuarters(year: number): Quarter[] {
  return [
    {
      label: `Q1`,
      key: `${year}-Q1`,
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 2, 31),
    },
    {
      label: `Q2`,
      key: `${year}-Q2`,
      startDate: new Date(year, 3, 1),
      endDate: new Date(year, 5, 30),
    },
    {
      label: `Q3`,
      key: `${year}-Q3`,
      startDate: new Date(year, 6, 1),
      endDate: new Date(year, 8, 30),
    },
    {
      label: `Q4`,
      key: `${year}-Q4`,
      startDate: new Date(year, 9, 1),
      endDate: new Date(year, 11, 31),
    },
    {
      label: `상반기`,
      key: `${year}-H1`,
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 5, 30),
    },
    {
      label: `하반기`,
      key: `${year}-H2`,
      startDate: new Date(year, 6, 1),
      endDate: new Date(year, 11, 31),
    },
  ];
}

export function detectQuarter(startDate: Date, endDate: Date): string | null {
  const year = startDate.getFullYear();
  const quarters = getQuarters(year);
  for (const q of quarters) {
    if (
      startDate.getTime() === q.startDate.getTime() &&
      endDate.getTime() === q.endDate.getTime()
    ) {
      return q.key;
    }
  }
  return null;
}

export function getQuarterLabel(startDate: Date): string {
  const month = startDate.getMonth();
  const year = startDate.getFullYear();
  if (month < 3) return `${year}년 1분기`;
  if (month < 6) return `${year}년 2분기`;
  if (month < 9) return `${year}년 3분기`;
  return `${year}년 4분기`;
}

export function QuarterPicker({
  year,
  selectedQuarter,
  onSelect,
  className,
}: QuarterPickerProps) {
  const currentYear = year ?? new Date().getFullYear();
  const [displayYear, setDisplayYear] = React.useState(currentYear);
  const quarters = getQuarters(displayYear);

  const quarterItems = quarters.slice(0, 4);
  const halfItems = quarters.slice(4);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Year selector */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setDisplayYear((y) => y - 1)}
          className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-sm font-semibold tabular-nums min-w-[4ch] text-center">
          {displayYear}
        </span>
        <button
          type="button"
          onClick={() => setDisplayYear((y) => y + 1)}
          className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Quarter chips */}
      <div className="grid grid-cols-4 gap-2">
        {quarterItems.map((q) => (
          <button
            key={q.key}
            type="button"
            onClick={() => onSelect(q)}
            className={cn(
              "relative px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              "border hover:border-foreground/30",
              selectedQuarter === q.key
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-background text-foreground border-border hover:bg-accent"
            )}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Half-year chips */}
      <div className="grid grid-cols-2 gap-2">
        {halfItems.map((q) => (
          <button
            key={q.key}
            type="button"
            onClick={() => onSelect(q)}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
              "border hover:border-foreground/30",
              selectedQuarter === q.key
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground"
            )}
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}
