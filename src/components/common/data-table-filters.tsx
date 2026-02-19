"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface FilterConfig {
  key: string;
  label: string;
  type: "select";
  options: { value: string; label: string }[];
}

interface DataTableFiltersProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string | undefined) => void;
  onReset: () => void;
}

export function DataTableFilters({ filters, values, onChange, onReset }: DataTableFiltersProps) {
  const hasActiveFilters = Object.values(values).some((v) => v);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={values[filter.key] || "all"}
          onValueChange={(v) => onChange(filter.key, v === "all" ? undefined : v)}
        >
          <SelectTrigger className="h-9 w-auto min-w-[140px]">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 {filter.label}</SelectItem>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} className="h-9 px-2">
          <X className="mr-1 h-3.5 w-3.5" />초기화
        </Button>
      )}
    </div>
  );
}
