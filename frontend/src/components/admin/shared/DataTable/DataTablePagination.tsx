import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import React from "react";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  // số lượng bản ghi trong 1 trang
  pageSize?: number;
  totalItems?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  showPageSizeOptions?: boolean;
  pageSizeOptions?: number[];
  className?: string;
}

const DataTablePagination = <TData,>({
  table,
  pageSize = 10,
  totalItems,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
  showPageSizeOptions = true,
  pageSizeOptions = [10, 20, 30, 50, 100],
  className,
}: DataTablePaginationProps<TData>) => {
  const pageCount = table.getPageCount();
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();

  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : pageCount;

  const handlePageSizeChange = (value: string) => {
    const size = Number(value);
    if (onPageSizeChange) {
      onPageSizeChange(size);
    } else {
      table.setPageSize(size);
    }
  };

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      table.setPageIndex(page - 1);
    }
  };

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(
    currentPage * pageSize,
    totalItems || startIndex + pageSize - 1,
  );
  return (
    <div
      className={cn("flex items-center justify-between px-2 py-4", className)}
    >
      {/* Left: Page size selector */}
      {showPageSizeOptions && onPageChange && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Số dòng</p>
          <Select
            value={pageSize.toString()}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">
            Trang {currentPage} / {totalPages}
          </p>
          {totalItems && (
            <p className="text-sm text-muted-foreground">
              ({totalItems.toLocaleString()} kết quả)
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* First page */}
          <Button
            className={"hidden size-8 p-0 lg:flex"}
            variant={"outline"}
            onClick={() => handlePageChange(1)}
            disabled={!canPreviousPage && currentPage === 1}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          {/* Previous page */}
          <Button
            className={"size-8 p-0"}
            variant={"outline"}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!canPreviousPage && currentPage === 1}
          >
            <ChevronLeft className="size-4" />
          </Button>

          {/* Page number */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                }
                if (pageNum > totalPages) {
                  pageNum = totalPages - 4 + i;
                }
              }
              return pageNum;
            }).map((pageNum, index, array) => {
              // add ellipsis
              if (index > 0 && pageNum - array[index - 1] > 1) {
                return (
                  <React.Fragment key={`ellipsis-${pageNum}`}>
                    <span className="px-2 text-muted-foreground">...</span>
                  </React.Fragment>
                );
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  className="size-8 p-0"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            className={"size-8 p-0"}
            variant={"outline"}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!canNextPage && currentPage === totalPages}
          >
            <ChevronRight className="size-4" />
          </Button>

          <Button
            className={"hidden size-8 p-0 lg:flex"}
            variant={"outline"}
            onClick={() => handlePageChange(totalPages)}
            disabled={!canNextPage && currentPage === totalPages}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTablePagination;
