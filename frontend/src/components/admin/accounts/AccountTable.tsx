import type { Account } from "@/types/admin/account";
import { AccountColumns } from "@/components/admin/accounts/AccountColumns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Edit,
  MoreHorizontal,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import DataTable from "@/components/admin/shared/DataTable/DataTable";

interface AccountTableProps {
  accounts: Account[];
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  // actions
  onEdit?: (id: string) => void;
  onToggleStatus?: (id: string, isActive: boolean) => void;
  onDelete?: (id: string) => void;
}
const AccountTable = ({
  accounts,
  loading = false,
  pagination = { currentPage: 1, totalPages: 1, totalItems: 0 },
  onPageChange,
  onPageSizeChange,
  onEdit,
  onToggleStatus,
  onDelete,
}: AccountTableProps) => {
  // Tiêm logic handlers vào cột Actions
  const columnsWithHandlers = AccountColumns.map((col) => {
    if (col.id === "actions") {
      return {
        ...col,
        cell: ({ row }) => {
          const account = row.original;

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuItem onClick={() => onEdit?.(account._id)}>
                    <Edit className="mr-2 size-4" /> Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      onToggleStatus?.(account._id, !account.isActive)
                    }
                    className={
                      account.isActive ? "text-orange-600" : "text-green-600"
                    }
                  >
                    {account.isActive ? (
                      <ToggleLeft className="mr-2 size-4" />
                    ) : (
                      <ToggleRight className="mr-2 size-4" />
                    )}
                    {account.isActive ? "Ẩn" : "Hiển thị"}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => onDelete?.(account._id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 size-4" /> Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      };
    }
    return col;
  });
  return (
    <DataTable<Account, any>
      columns={columnsWithHandlers}
      data={accounts}
      loading={loading}
      tableClassName="min-w-[860px] lg:min-w-[920px]"
      enableSorting
      enablePagination
      pageSize={10}
      totalItems={pagination.totalItems}
      currentPage={pagination.currentPage}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onRowClick={(row) => onEdit?.(row._id)}
    />
  );
};

export default AccountTable;
