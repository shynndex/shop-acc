import { useCallback, useMemo, useState } from "react";

import { PageHeader, SearchBar, FilterBar, FilterDropdown, DataTable } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useOrdersQuery, useOrderStatsQuery } from "@/hooks/queries/useAdminQueries";
import { useFilterParams } from "@/hooks/useFilterParams";
import { useExportCsv } from "@/hooks/useExportCsv";
import { orderService } from "@/services/admin/order.service";
import { SkeletonStatsRow } from "@/components/ui/skeletons";
import { cn, formatVND, formatDate } from "@/lib/utils";
import type { Order, OrderStats } from "@/types/admin/order.type";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ShoppingCart,
  RefreshCw,
  AlertCircle,
  Download,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle,
  Banknote,
  Wallet,
  CreditCard,
} from "lucide-react";

const FILTER_CONFIGS = [
  { key: "search", defaultValue: "" },
  { key: "status", defaultValue: "" },
  { key: "paymentMethod", defaultValue: "" },
  { key: "page", defaultValue: 1, numeric: true },
  { key: "limit", defaultValue: 15, numeric: true },
] as const;

// ── Status Badge ────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
  cancelled: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const paymentMethodLabels: Record<string, string> = {
  balance: "Số dư",
  bank: "Chuyển khoản",
  card: "Thẻ cào",
  payos: "PayOS",
};

const paymentMethodIcons: Record<string, React.ReactNode> = {
  balance: <Wallet className="size-3" />,
  bank: <Banknote className="size-3" />,
  card: <CreditCard className="size-3" />,
  payos: <CreditCard className="size-3" />,
};

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "processing", label: "Đang xử lý" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

const paymentOptions = [
  { value: "", label: "Tất cả phương thức" },
  { value: "balance", label: "Số dư" },
  { value: "bank", label: "Chuyển khoản" },
  { value: "card", label: "Thẻ cào" },
  { value: "payos", label: "PayOS" },
];

// ── Columns ─────────────────────────────────────────────────────
function useOrderColumns(handleViewDetail: (order: Order) => void) {
  return useMemo<ColumnDef<Order>[]>(
    () => [
      {
        id: "transactionId",
        header: "Mã giao dịch",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">
            {row.original.transactionId?.slice(-10)}
          </span>
        ),
      },
      {
        id: "user",
        header: "Người dùng",
        meta: { cellClassName: "hidden md:table-cell" },
        cell: ({ row }) => (
          <div>
            <div className="text-sm font-medium">
              {row.original.user?.displayName || row.original.user?.username || "N/A"}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.user?.email || ""}
            </div>
          </div>
        ),
      },
      {
        id: "account",
        header: "Tài khoản",
        cell: ({ row }) => (
          <div className="max-w-[200px]">
            <div className="text-sm truncate">{row.original.account?.title || "N/A"}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.account?.game}
            </div>
          </div>
        ),
      },
      {
        id: "amount",
        header: "Số tiền",
        meta: { cellClassName: "hidden sm:table-cell text-right" },
        cell: ({ row }) => (
          <div className="text-right">
            <div className="font-semibold text-green-600">
              {formatVND(row.original.amount)}đ
            </div>
            {row.original.originalPrice && row.original.originalPrice !== row.original.amount && (
              <div className="text-xs text-muted-foreground line-through">
                {formatVND(row.original.originalPrice)}đ
              </div>
            )}
          </div>
        ),
      },
      {
        id: "paymentMethod",
        header: "Thanh toán",
        meta: { cellClassName: "hidden lg:table-cell" },
        cell: ({ row }) => (
          <Badge variant="outline" className="gap-1 text-xs">
            {paymentMethodIcons[row.original.paymentMethod]}
            {paymentMethodLabels[row.original.paymentMethod] || row.original.paymentMethod}
          </Badge>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant="outline" className={cn("font-medium", statusColors[status] || "")}>
              {statusLabels[status] || status}
            </Badge>
          );
        },
      },
      {
        id: "createdAt",
        header: "Thời gian",
        meta: { cellClassName: "hidden sm:table-cell" },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => handleViewDetail(row.original)}
            title="Xem chi tiết"
          >
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    [handleViewDetail],
  );
}

// ── Detail Dialog ───────────────────────────────────────────────
function OrderDetailDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chi tiết đơn hàng</DialogTitle>
          <DialogDescription>
            Mã giao dịch: <span className="font-mono font-medium">{order.transactionId}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={cn("font-medium text-sm px-3 py-1", statusColors[order.status] || "")}>
              {statusLabels[order.status] || order.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDate(order.createdAt)}
            </span>
          </div>

          <Separator />

          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">Người mua</h4>
            <p className="text-sm font-medium">
              {order.user?.displayName || order.user?.username || "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">{order.user?.email}</p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">Tài khoản</h4>
            <p className="text-sm font-medium">{order.account?.title || "N/A"}</p>
            <p className="text-xs text-muted-foreground">
              Game: {order.account?.game} — Giá: {formatVND(order.account?.price || 0)}đ
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">Thanh toán</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                {paymentMethodIcons[order.paymentMethod]}
                {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
              </Badge>
              <span className="text-sm font-semibold text-green-600">
                {formatVND(order.amount)}đ
              </span>
            </div>
            {order.discount && (
              <p className="text-xs text-muted-foreground mt-1">
                Giảm giá: {order.discount.code} ({order.discount.type === "percent" ? `${order.discount.value}%` : `${formatVND(order.discount.value)}đ`})
                — Giảm {formatVND(order.discount.amount)}đ
              </p>
            )}
          </div>

          {order.notes && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Ghi chú</h4>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
            {order.completedAt && (
              <div>
                <span className="font-medium">Hoàn thành:</span> {formatDate(order.completedAt)}
              </div>
            )}
            {order.cancelledAt && (
              <div>
                <span className="font-medium">Hủy:</span> {formatDate(order.cancelledAt)}
              </div>
            )}
            {order.cancelledReason && (
              <div className="sm:col-span-2">
                <span className="font-medium">Lý do hủy:</span> {order.cancelledReason}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Stats Card ──────────────────────────────────────────────────
function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <GlassCard className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">            <div className={cn("size-8 sm:size-10 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
            <Icon className="size-4 sm:size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xl sm:text-2xl font-bold break-all sm:break-normal">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </GlassCard>
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const { filters, setFilter, setFilters, resetFilters, hasActiveFilters } = useFilterParams(FILTER_CONFIGS);

  const {
    data: ordersData,
    isLoading: listLoading,
    isFetching: listFetching,
    refetch: refetchList,
  } = useOrdersQuery({
    page: filters.page as number,
    limit: filters.limit as number,
    status: (filters.status as string) || undefined,
    paymentMethod: (filters.paymentMethod as string) || undefined,
    search: (filters.search as string) || undefined,
  });

  const {
    data: stats,
    refetch: refetchStats,
  } = useOrderStatsQuery();

  const { handleExport, exporting } = useExportCsv(orderService.exportCsv);

  const orders: Order[] = ordersData?.orders || [];
  const pagination = {
    currentPage: ordersData?.currentPage || 1,
    totalPages: ordersData?.totalPages || 1,
    totalItems: ordersData?.totalItems || 0,
  };
  const loading = listLoading && !ordersData;

  const handleRefresh = useCallback(() => {
    refetchList();
    refetchStats();
  }, [refetchList, refetchStats]);

  const handleViewDetail = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowDetail(true);
  }, []);

  const columns = useOrderColumns(handleViewDetail);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Error placeholder — react-query manages error state via data freshness */}
      {listFetching && !listLoading && !ordersData && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>Không thể tải danh sách đơn hàng</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <PageHeader
        title="Quản lý đơn hàng"
        description="Theo dõi và quản lý tất cả đơn hàng mua tài khoản"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport(filters, `orders_${Date.now()}.csv`)}
              disabled={loading || exporting}
            >
              <Download className="mr-2 size-4" />
              {exporting ? "Đang xuất..." : "Export CSV"}
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={listFetching}>
              <RefreshCw className={cn("mr-2 size-4", listFetching && "animate-spin")} />
              Làm mới
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Tổng đơn hàng"
            value={stats.byStatus.totalOrders.toLocaleString("vi-VN")}
            subtitle={`Doanh thu: ${formatVND(stats.byStatus.totalAmount)}đ`}
            icon={ShoppingCart}
            colorClass="bg-blue-100 text-blue-700"
          />
          <StatsCard
            title="Hôm nay"
            value={stats.today.count.toLocaleString("vi-VN")}
            subtitle={`Doanh thu: ${formatVND(stats.today.revenue)}đ`}
            icon={TrendingUp}
            colorClass="bg-green-100 text-green-700"
          />
          <StatsCard
            title="Chờ xử lý"
            value={stats.byStatus.pending.toLocaleString("vi-VN")}
            icon={Clock}
            colorClass="bg-amber-100 text-amber-700"
          />
          <StatsCard
            title="Hoàn thành"
            value={stats.byStatus.completed.toLocaleString("vi-VN")}
            icon={CheckCircle}
            colorClass="bg-emerald-100 text-emerald-700"
          />
        </div>
      ) : (
        <SkeletonStatsRow count={4} />
      )}

      {/* Filters */}
      <FilterBar
        showReset={hasActiveFilters}
        onReset={() => resetFilters()}
      >
        <div className="flex-1 min-w-[200px]">
          <SearchBar
            placeholder="Tìm theo mã giao dịch hoặc ghi chú..."
            value={filters.search as string}
            onSearch={(v) => setFilter("search", v)}
          />
        </div>
        <div className="w-[160px]">
          <FilterDropdown
            placeholder="Trạng thái"
            value={filters.status as string}
            onChange={(v) => setFilter("status", v)}
            options={statusOptions}
          />
        </div>
        <div className="w-[160px]">
          <FilterDropdown
            placeholder="Phương thức"
            value={filters.paymentMethod as string}
            onChange={(v) => setFilter("paymentMethod", v)}
            options={paymentOptions}
          />
        </div>
      </FilterBar>

      {/* Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        pageSize={filters.limit as number}
        totalItems={pagination.totalItems}
        currentPage={pagination.currentPage}
        onPageChange={(page) => setFilter("page", page)}
        onPageSizeChange={(size) => setFilters({ limit: size, page: 1 })}
        emptyState={
          <EmptyState
            icon={ShoppingCart}
            title="Không tìm thấy đơn hàng"
            description="Thử thay đổi bộ lọc hoặc đợi đơn hàng mới"
          />
        }
      />

      {/* Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
    </div>
  );
}
