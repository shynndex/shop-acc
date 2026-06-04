import { useCallback, useState } from "react";
import { toast } from "sonner";

/**
 * Server-side CSV export via API blob download.
 * If the service function throws, it falls through to the catch handler.
 */
export function useExportCsv(serviceFn?: (params?: Record<string, any>) => Promise<Blob>) {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(
    async (params?: Record<string, any>, filename?: string) => {
      if (!serviceFn) return;
      setExporting(true);
      try {
        const blob = await serviceFn(params);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || `export-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Đã tải xuống file CSV");
      } catch (err: any) {
        toast.error(err?.message || "Lỗi khi tải xuống CSV");
      } finally {
        setExporting(false);
      }
    },
    [serviceFn],
  );

  return { handleExport, exporting };
}

/**
 * Client-side CSV export from existing data (no backend endpoint needed).
 * Supports nested objects via dot-notation column accessors.
 */
export function exportTableToCsv<T extends Record<string, any>>(
  data: T[],
  columns: { key: string; label: string }[],
  filename = `export-${Date.now()}.csv`,
) {
  if (!data.length) {
    toast.error("Không có dữ liệu để xuất");
    return;
  }

  try {
    // Build CSV header row
    const header = columns.map((c) => escapeCsvField(c.label)).join(",");

    // Build data rows
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const value = getNestedValue(row, col.key);
          return escapeCsvField(formatCsvValue(value));
        })
        .join(","),
    );

    const csv = [header, ...rows].join("\n");
    const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Đã tải xuống file CSV");
  } catch {
    toast.error("Lỗi khi tạo file CSV");
  }
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => {
    if (current == null) return "";
    if (Array.isArray(current)) {
      // For array fields like "user.username", try to access first element
      return current.length > 0 ? current[0]?.[key] ?? "" : "";
    }
    return current[key] ?? "";
  }, obj);
}

function formatCsvValue(value: any): string {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
