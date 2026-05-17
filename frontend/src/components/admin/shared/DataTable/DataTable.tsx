import * as React from "react";
import type {
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FolderX } from "lucide-react";
import { cn } from "@/lib/utils";
import DataTablePagination from "./DataTablePagination";

type DataTableColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  className?: string;
  tableClassName?: string;
  enableSorting?: boolean;
  enableColumnFilters?: boolean;
  enableRowSelection?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  totalItems?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  onRowClick?: (row: TData) => void;
}

const DataTable = <TData, TValue>({
  columns,
  data,
  loading = false,
  className,
  tableClassName,
  enableSorting = true,
  enableColumnFilters = false,
  enableRowSelection = false,
  enablePagination = true,
  pageSize = 10,
  totalItems,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
  emptyState,
  loadingState,
  onRowClick,
}: DataTableProps<TData, TValue>) => {
  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    enableSorting,
    enableRowSelection,
    state: {
      rowSelection,
      sorting,
      columnVisibility,
    },
  });

  // Default loading state
  const defaultLoadingState = Array.from({ length: pageSize }).map((_, i) => (
    <TableRow key={i} className="animate-pulse">
      {columns.map((_, j) => (
        <TableCell key={j}>
          <div className="h-4 w-full rounded bg-muted"></div>
        </TableCell>
      ))}
    </TableRow>
  ));

  // Default empty state
  const visibleColumnCount = table.getVisibleLeafColumns().length || 1;
  const defaultEmptyState = (
    <TableRow>
      <TableCell
        colSpan={visibleColumnCount}
        className="h-32 p-0 align-middle whitespace-normal"
      >
        <div className="mx-auto flex h-full w-full flex-col items-center justify-center text-center text-muted-foreground">
          <FolderX className="mb-2 h-12 w-12 opacity-50" />
          <p className="text-sm font-medium">Không có dữ liệu</p>
          <p className="mt-1 text-xs">Thêm tài khoản đầu tiên để bắt đầu</p>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-md border">
        <Table className={tableClassName}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      (header.column.columnDef.meta as DataTableColumnMeta)
                        ?.headerClassName
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading
              ? loadingState || defaultLoadingState
              : table.getRowModel().rows?.length
                ? table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      onClick={() => onRowClick?.(row.original)}
                      className={
                        onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={
                            (cell.column.columnDef.meta as DataTableColumnMeta)
                              ?.cellClassName
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : emptyState || defaultEmptyState}
          </TableBody>
        </Table>
      </div>

      {enablePagination && (
        <DataTablePagination
          table={table}
          pageSize={pageSize}
          totalItems={totalItems}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
};

export default DataTable;
