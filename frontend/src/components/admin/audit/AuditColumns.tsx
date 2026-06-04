import { Badge } from "@/components/ui/badge";
import type { AuditLog } from "@/types/admin/audit.type";
import type { ColumnDef } from "@tanstack/react-table";

const actionLabels: Record<string, { label: string; color: string; darkColor?: string }> = {
  "account:create": { label: "Tạo tài khoản", color: "bg-green-500 text-white", darkColor: "dark:bg-green-500" },
  "account:update": { label: "Cập nhật tài khoản", color: "bg-blue-500 text-white", darkColor: "dark:bg-blue-500" },
  "account:toggle": { label: "Ẩn/Hiện tài khoản", color: "bg-yellow-500 text-white", darkColor: "dark:bg-yellow-500" },
  "account:delete": { label: "Xóa tài khoản", color: "bg-red-500 text-white", darkColor: "dark:bg-red-500" },
  "deposit:approve": { label: "Duyệt nạp tiền", color: "bg-green-500 text-white", darkColor: "dark:bg-green-500" },
  "deposit:reject": { label: "Từ chối nạp tiền", color: "bg-red-500 text-white", darkColor: "dark:bg-red-500" },
  "deposit:cancel": { label: "Hủy giao dịch", color: "bg-gray-500 text-white", darkColor: "dark:bg-gray-600" },
  "giftcode:create": { label: "Tạo mã giảm giá", color: "bg-green-500 text-white", darkColor: "dark:bg-green-500" },
  "giftcode:update": { label: "Cập nhật mã", color: "bg-blue-500 text-white", darkColor: "dark:bg-blue-500" },
  "giftcode:delete": { label: "Xóa mã giảm giá", color: "bg-red-500 text-white", darkColor: "dark:bg-red-500" },
  "review:approve": { label: "Duyệt đánh giá", color: "bg-green-500 text-white", darkColor: "dark:bg-green-500" },
  "review:reject": { label: "Từ chối đánh giá", color: "bg-red-500 text-white", darkColor: "dark:bg-red-500" },
  "balance:adjust": { label: "Điều chỉnh số dư", color: "bg-purple-500 text-white", darkColor: "dark:bg-purple-500" },
  "admin:login": { label: "Đăng nhập", color: "bg-indigo-500 text-white", darkColor: "dark:bg-indigo-500" },
  "admin:logout": { label: "Đăng xuất", color: "bg-orange-500 text-white", darkColor: "dark:bg-orange-500" },
};

const resourceLabels: Record<string, string> = {
  account: "Tài khoản game",
  deposit: "Nạp tiền",
  giftcode: "Mã giảm giá",
  review: "Đánh giá",
  user_balance: "Số dư người dùng",
  auth: "Xác thực",
};

export const AuditColumns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: "createdAt",
    header: "Thời gian",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt") as string);
      return (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {date.toLocaleString("vi-VN")}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "adminName",
    header: "Quản trị viên",
    cell: ({ row }) => {
      const name = row.getValue("adminName") as string;
      return <span className="font-medium">{name || "N/A"}</span>;
    },
  },
  {
    accessorKey: "action",
    header: "Hành động",
    cell: ({ row }) => {
      const action = row.getValue("action") as string;
      const meta = actionLabels[action] || {
        label: action,
        color: "bg-gray-500 dark:bg-gray-600 text-white",
        darkColor: "dark:bg-gray-600",
      };
      return (
        <Badge className={`${meta.color} ${meta.darkColor || ''} whitespace-nowrap`}>
          {meta.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "resource",
    header: "Tài nguyên",
    cell: ({ row }) => {
      const resource = row.getValue("resource") as string;
      return (
        <span className="text-sm">{resourceLabels[resource] || resource}</span>
      );
    },
  },
  {
    accessorKey: "resourceId",
    header: "ID",
    meta: { cellClassName: "hidden sm:table-cell" },
    cell: ({ row }) => {
      const id = row.getValue("resourceId") as string | null;
      return id ? (
        <span className="text-xs text-muted-foreground font-mono truncate max-w-[100px] block">
          {id}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "ip",
    header: "IP",
    meta: { cellClassName: "hidden lg:table-cell" },
    cell: ({ row }) => {
      const ip = row.getValue("ip") as string;
      return ip ? (
        <span className="text-xs text-muted-foreground">{ip}</span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
  },
];
