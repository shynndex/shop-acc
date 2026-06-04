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
import { EmptyState } from "@/components/ui/empty";
import { Checkbox } from "@/components/ui/checkbox";
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
  /** Controlled row selection (record of row id -> boolean) */
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
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
  rowSelection: externalRowSelection,
  onRowSelectionChange: externalOnRowSelectionChange,
}: DataTableProps<TData, TValue>) => {
  const [internalRowSelection, setInternalRowSelection] = React.useState<
    Record<string, boolean>
  >({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // Use controlled or internal row selection
  const rowSelection = externalRowSelection ?? internalRowSelection;
  const setRowSelection = externalOnRowSelectionChange ?? setInternalRowSelection;

  // Add select column when row selection is enabled
  const columnsWithSelect = React.useMemo(() => {
    if (!enableRowSelection) return columns;

    const selectColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        headerClassName: "w-[40px]",
        cellClassName: "w-[40px]",
      } as DataTableColumnMeta,
    };

    return [selectColumn, ...columns];
  }, [columns, enableRowSelection]);

  // Get row id for selection
  const getRowId = React.useCallback((row: TData) => {
    return (row as any)._id || (row as any).id || (row as any).transactionId;
  }, []);

  const table = useReactTable({
    data,
    columns: columnsWithSelect,
    getRowId,
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
      {columnsWithSelect.map((_, j) => (
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
        <EmptyState
          icon={FolderX}
          title="Không có dữ liệu"
          description="Thêm tài khoản đầu tiên để bắt đầu"
        />
      </TableCell>
    </TableRow>
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="w-full overflow-x-auto rounded-md border">
        <Table className={cn(tableClassName, "min-w-[650px] lg:min-w-0")}>
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
                      className={cn(
                        "transition-colors duration-150",
                        onRowClick ? "cursor-pointer hover:bg-muted/50" : "",
                        row.getIsSelected() && "bg-muted/50",
                      )}
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
