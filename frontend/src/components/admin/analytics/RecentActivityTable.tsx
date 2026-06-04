import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ActivityItem } from "@/types/admin/analytics.type";
import { cn, formatVND } from "@/lib/utils";

interface RecentActivityTableProps {
  activities: ActivityItem[];
  loading?: boolean;
}

const typeColors: Record<string, string> = {
  deposit: "bg-blue-100 text-blue-800",
  account_created: "bg-purple-100 text-purple-800",
  account_sold: "bg-green-100 text-green-800",
  user_registered: "bg-orange-100 text-orange-800",
};

const typeLabels: Record<string, string> = {
  deposit: "Nạp tiền",
  account_created: "Tạo tài khoản",
  account_sold: "Bán tài khoản",
  user_registered: "Đăng ký user",
};

export function RecentActivityTable({ activities, loading }: RecentActivityTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không có hoạt động gần đây
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Thời gian</TableHead>
            <TableHead>Hoạt động</TableHead>
            <TableHead className="hidden sm:table-cell">Người dùng</TableHead>
            <TableHead className="text-right whitespace-nowrap">Số tiền</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {new Date(activity.createdAt).toLocaleString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell className="min-w-0 max-w-[120px] sm:max-w-none">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={cn(typeColors[activity.type], "shrink-0")}>
                    {typeLabels[activity.type]}
                  </Badge>
                  <span className="text-sm truncate">{activity.description}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm hidden sm:table-cell">
                {activity.user?.username || "N/A"}
                {activity.user?.email && (
                  <div className="text-xs text-muted-foreground truncate max-w-[120px]">{activity.user.email}</div>
                )}
              </TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap">
                {activity.amount ? formatVND(activity.amount) + "đ" : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}