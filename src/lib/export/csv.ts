import Papa from "papaparse";

interface ExportOptions {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}

/**
 * CSV 내보내기
 * - BOM 추가로 Excel에서 한글 깨짐 방지
 * - papaparse 사용
 */
export function exportCSV({ filename, headers, rows }: ExportOptions) {
  const data = [headers, ...rows];
  const csv = Papa.unparse(data);

  // UTF-8 BOM 추가 (Excel 한글 지원)
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * PDF 내보내기 (브라우저 인쇄 기능 활용)
 */
export function exportPDF() {
  window.print();
}
