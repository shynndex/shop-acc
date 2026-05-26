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
import { formatVND } from "@/lib/utils";

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Thời gian</TableHead>
          <TableHead>Hoạt động</TableHead>
          <TableHead>Người dùng</TableHead>
          <TableHead className="text-right">Số tiền</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activities.map((activity) => (
          <TableRow key={activity.id}>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(activity.createdAt).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={typeColors[activity.type]}>
                  {typeLabels[activity.type]}
                </Badge>
                <span className="text-sm">{activity.description}</span>
              </div>
            </TableCell>
            <TableCell className="text-sm">
              {activity.user?.username || "N/A"}
              {activity.user?.email && (
                <div className="text-xs text-muted-foreground">{activity.user.email}</div>
              )}
            </TableCell>
            <TableCell className="text-right font-medium">
              {activity.amount ? formatVND(activity.amount) + "đ" : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}