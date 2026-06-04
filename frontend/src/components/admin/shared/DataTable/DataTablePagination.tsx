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
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : pageCount;
  const normalizedTotalPages = Math.max(1, totalPages || 1);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= normalizedTotalPages;

  const handlePageSizeChange = (value: string) => {
    const size = Number(value);
    if (onPageSizeChange) {
      onPageSizeChange(size);
    } else {
      table.setPageSize(size);
    }
  };

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(normalizedTotalPages, Math.max(1, page));
    if (nextPage === currentPage) return;

    if (onPageChange) {
      onPageChange(nextPage);
    } else {
      table.setPageIndex(nextPage - 1);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-2 py-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {/* Left: Page size selector */}
      {showPageSizeOptions && onPageChange && (
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <p className="hidden text-sm text-muted-foreground sm:inline">Số dòng</p>
          <p className="text-sm text-muted-foreground sm:hidden">/ trang</p>
          <Select
            value={pageSize.toString()}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="h-8 w-[74px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-6 lg:gap-8">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">
            Trang {currentPage} / {normalizedTotalPages}
          </p>
          {totalItems !== undefined && totalItems > 0 && (
            <p className="text-sm text-muted-foreground">
              ({totalItems.toLocaleString()} kết quả)
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 sm:justify-end">
          {/* First page */}
          <Button
            className={"hidden size-8 p-0 lg:flex transition-all duration-150"}
            variant={"outline"}
            onClick={() => handlePageChange(1)}
            disabled={isFirstPage}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          {/* Previous page */}
          <Button
            className={"size-8 p-0 transition-all duration-150"}
            variant={"outline"}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={isFirstPage}
          >
            <ChevronLeft className="size-4" />
          </Button>

          {/* Page number */}
          <div className="hidden items-center gap-1 sm:flex">
            {Array.from({ length: Math.min(5, normalizedTotalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (normalizedTotalPages > 5) {
                if (currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                }
                if (pageNum > normalizedTotalPages) {
                  pageNum = normalizedTotalPages - 4 + i;
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
                  className="size-8 p-0 transition-all duration-150"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            className={"size-8 p-0 transition-all duration-150"}
            variant={"outline"}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={isLastPage}
          >
            <ChevronRight className="size-4" />
          </Button>

          <Button
            className={"hidden size-8 p-0 lg:flex transition-all duration-150"}
            variant={"outline"}
            onClick={() => handlePageChange(normalizedTotalPages)}
            disabled={isLastPage}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTablePagination;
