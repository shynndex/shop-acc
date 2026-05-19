import { DepositColumns } from "./DepositColumns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, Eye, MoreHorizontal, X } from "lucide-react";
import { DataTable } from "../shared";
import type { Deposit } from "@/types/admin/deposit.type";
import { useMemo } from "react";
import type { CellContext } from "@tanstack/react-table";

interface DepositTableProps {
  deposits: Deposit[];
  loading?: boolean;
  pagination: { currentPage: number; totalPages: number; totalItems: number };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  // actions
  onViewDetail: (deposit: Deposit) => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

const DepositTable = ({
  deposits,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onApprove,
  onReject,
}: DepositTableProps) => {
  const columnsWithHandlers = useMemo(
    () =>
      DepositColumns.map((col) => {
        if (col.id === "actions") {
          return {
            ...col,
            cell: ({ row }: CellContext<Deposit, unknown>) => {
              const deposit = row.original;

              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Mở menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetail(deposit)}>
                      <Eye className="mr-2 size-4" /> Xem chi tiết
                    </DropdownMenuItem>
                    {deposit.status === "PENDING" && (
                      <>
                        <DropdownMenuItem
                          className="text-green-600"
                          onClick={() => onApprove(deposit._id)}
                        >
                          <Check className="mr-2 size-4" /> Duyệt
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => onReject(deposit._id)}
                        >
                          <X className="mr-2 size-4" /> Từ chối
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            },
          };
        }
        return col;
      }),
    [onViewDetail, onApprove, onReject],
  );

  return (
    <DataTable
      columns={columnsWithHandlers}
      data={deposits}
      loading={loading}
      totalItems={pagination.totalItems}
      currentPage={pagination.currentPage}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
};

export default DepositTable;
