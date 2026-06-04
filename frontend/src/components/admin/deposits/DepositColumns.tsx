import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatVND } from "@/lib/utils";
import type { Deposit } from "@/types/admin/deposit.type";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, Edit, Eye, MoreHorizontal, X } from "lucide-react";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500 dark:bg-yellow-600",
  PAID: "bg-green-500 dark:bg-green-600",
  FAILED: "bg-red-500 dark:bg-red-600",
  CANCELLED: "bg-gray-500 dark:bg-gray-600",
};

export const DepositColumns: ColumnDef<Deposit>[] = [
  {
    accessorKey: "userUsername",
    header: "Người dùng",
    cell: ({ row }) => {
      const username = row.getValue("userUsername") as string;
      const email = row.original.userEmail;
      return (
        <div>
          <div className="font-medium">{username || "N/A"}</div>
          {email && (
            <div className="text-sm text-muted-foreground">{email}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Loại",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge variant={type === "bank" ? "default" : "secondary"}>
          {type === "bank" ? "Chuyển khoản" : "Thẻ cào"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          className={`${statusColors[status] || "bg-gray-500"} text-white`}
        >
          {status}
        </Badge>
      );
    },
  },

  {
    accessorKey: "amount",
    header: "Số tiền",
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      const fee = row.original.fee; //phí cho card deposit
      return (
        <div className="text-right">
          <div className="font-semibold text-green-600">
            {formatVND(amount)}đ
          </div>
          {fee !== undefined && fee > 0 && (
            <div className="text-xs text-muted-foreground">
              Phí: {formatVND(fee)}đ
            </div>
          )}
        </div>
      );
    },
    enableSorting: true,
  },

  {
    accessorKey: "createdAt",
    header: "Thời gian",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt") as string);
      return (
        <span className="text-sm text-muted-foreground">
          {date.toLocaleString("vi-VN")}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
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
            <DropdownMenuItem>
              <Eye className="mr-2 size-4" /> Xem chi tiết
            </DropdownMenuItem>
            {deposit.status === "PENDING" && (
              <>
                <DropdownMenuItem className="text-green-600">
                  <Check className="mr-2 size-4" /> Duyệt
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <X className="mr-2 size-4" /> Từ chối
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
