"use client";

import { useCallback } from "react";
import { exportCSV, exportPDF } from "@/lib/export/csv";
import { toast } from "sonner";

interface UseExportOptions {
  filename: string;
  headers: string[];
  getRows: () => (string | number)[][];
}

export function useExport({ filename, headers, getRows }: UseExportOptions) {
  const handleCSV = useCallback(() => {
    try {
      const rows = getRows();
      if (rows.length === 0) {
        toast.error("내보낼 데이터가 없습니다.");
        return;
      }
      exportCSV({ filename, headers, rows });
      toast.success("CSV 파일이 다운로드되었습니다.");
    } catch {
      toast.error("CSV 내보내기에 실패했습니다.");
    }
  }, [filename, headers, getRows]);

  const handlePDF = useCallback(() => {
    exportPDF();
  }, []);

  return { handleCSV, handlePDF };
}
