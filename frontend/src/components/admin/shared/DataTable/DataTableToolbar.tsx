import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import React from "react";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
  className?: string;
}

const DataTableToolbar = <TData,>({
  table,
  searchKey,
  searchPlaceholder = "Tìm kiếm...",
  actions,
  className,
}: DataTableToolbarProps<TData>) => {
  const isFiltered = table.getState().columnFilters.length > 0;
  return (
    <div className={cn("flex items-center justify-between ", className)}>
      <div className="flex flex-1 items-center gap-2">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
        {isFiltered && (
          <Button variant={"ghost"} onClick={() => table.resetColumnFilters()}>
            Reset
            <X className="ml-2 size-4" />
          </Button>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default DataTableToolbar;
