"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { exportCSV, exportPDF } from "@/lib/export/csv";

interface ExportButtonProps {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  disabled?: boolean;
}

export function ExportButton({ filename, headers, rows, disabled }: ExportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download className="mr-2 h-4 w-4" />
          내보내기
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportCSV({ filename, headers, rows })}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          CSV 다운로드
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportPDF()}>
          <Printer className="mr-2 h-4 w-4" />
          PDF 인쇄
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
