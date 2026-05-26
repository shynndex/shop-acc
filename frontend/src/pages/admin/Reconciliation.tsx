import { useCallback, useEffect, useMemo, useState } from "react";

import { ReconKPICards } from "@/components/admin/reconciliation/ReconKPICards";
import { ReconAlertsPanel } from "@/components/admin/reconciliation/ReconAlertsPanel";
import { PageHeader, FilterBar, SearchBar, FilterDropdown } from "@/components/admin/shared";
import { DataTable } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminReconciliationStore } from "@/stores/useAdminReconciliationStore";
import { cn, formatVND, formatDate } from "@/lib/utils";
import type { ReconDeposit } from "@/types/admin/reconciliation.type";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import {
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Banknote,
  CreditCard,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Status Badge ────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-200",
  PAID: "bg-green-500/10 text-green-600 border-green-200",
  SUCCESS: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  FAILED: "bg-red-500/10 text-red-600 border-red-200",
  CANCELLED: "bg-gray-500/10 text-gray-600 border-gray-200",
};

const statusLabels: Record<string, string> = {
  PENDING: "Chờ",
  PAID: "Đã thanh toán",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
};

// ── Columns ─────────────────────────────────────────────────────
const columns: ColumnDef<ReconDeposit>[] = [
  {
    id: "user",
    header: "Người dùng",
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-sm">{row.original.user?.username || "N/A"}</div>
        {row.original.user?.email && (
          <div className="text-xs text-muted-foreground">{row.original.user.email}</div>
        )}
      </div>
    ),
  },
  {
    id: "type",
    header: "Loại",
    cell: ({ row }) => {
      const isBank = row.original.type === "bank";
      return (
        <Badge variant={isBank ? "default" : "secondary"} className="gap-1">
          {isBank ? <Banknote className="size-3" /> : <CreditCard className="size-3" />}
          {isBank ? "Chuyển khoản" : "Thẻ cào"}
        </Badge>
      );
    },
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
    id: "amount",
    header: "Số tiền",
    cell: ({ row }) => {
      const amount = row.original.amount || 0;
      const declared = row.original.declaredValue;
      const mismatch = declared && declared !== amount;
      return (
        <div className="text-right">
          <div className="font-semibold text-green-600">{formatVND(amount)}đ</div>
          {mismatch && (
            <div className="text-xs text-red-500">
              Khai báo: {formatVND(declared)}đ
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "reference",
    header: "Mã/Nhà cung cấp",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.referenceCode || row.original.provider || "—"}
      </span>
    ),
  },
  {
    id: "createdAt",
    header: "Thời gian",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled>
            <Eye className="mr-2 size-4" /> Xem chi tiết
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

// ── Filter options ──────────────────────────────────────────────
const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "SUCCESS", label: "Thành công" },
  { value: "FAILED", label: "Thất bại" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const typeOptions = [
  { value: "", label: "Tất cả loại" },
  { value: "bank", label: "Chuyển khoản" },
  { value: "card", label: "Thẻ cào" },
];

// ── Page ────────────────────────────────────────────────────────
export default function ReconciliationPage() {
  const {
    kpis,
    depositMethods,
    recentTransactions,
    alerts,
    alertCounts,
    deposits,
    pagination,
    loading,
    error,
    fetchSummary,
    fetchAlerts,
    fetchDeposits,
  } = useAdminReconciliationStore();

  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: "",
    page: 1,
    limit: 15,
  });

  // ── Initial fetch ──────────────────────────────────────────────
  useEffect(() => {
    fetchSummary();
    fetchAlerts();
  }, [fetchSummary, fetchAlerts]);

  useEffect(() => {
    fetchDeposits(filters);
  }, [filters, fetchDeposits]);

  const handleRefresh = useCallback(() => {
    fetchSummary();
    fetchAlerts();
    fetchDeposits(filters);
  }, [fetchSummary, fetchAlerts, fetchDeposits, filters]);

  const handlePageChange = useCallback(
    (page: number) => setFilters((p) => ({ ...p, page })),
    [],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => setFilters((p) => ({ ...p, limit: size, page: 1 })),
    [],
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <PageHeader
        title="Đối soát giao dịch"
        description="Tổng quan, cảnh báo và danh sách giao dịch nạp tiền"
        actions={
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={cn("mr-2 size-4", loading && "animate-spin")} />
            Làm mới
          </Button>
        }
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="alerts">
            Cảnh báo
            {alertCounts.total > 0 && (
              <Badge
                variant={alertCounts.critical > 0 ? "destructive" : "secondary"}
                className="ml-2 text-[10px] px-1.5 py-0"
              >
                {alertCounts.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="deposits">Danh sách giao dịch</TabsTrigger>
        </TabsList>

        {/* ── Tab: Overview ───────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* KPI Cards */}
          <ReconKPICards kpis={kpis} loading={loading && !kpis} />

          {/* Deposit Methods Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Phân bổ phương thức nạp</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {depositMethods.map((m) => (
                    <div key={m.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {m.method === "bank" ? (
                          <Banknote className="size-4 text-blue-600" />
                        ) : (
                          <CreditCard className="size-4 text-purple-600" />
                        )}
                        <span className="text-sm font-medium">{m.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatVND(m.todayAmount)}đ</div>
                        <div className="text-xs text-muted-foreground">
                          {m.todayCount} giao dịch hôm nay
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Giao dịch gần đây</CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Chưa có giao dịch nào
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentTransactions.map((t) => (
                      <div
                        key={`${t.type}-${t.id}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {t.type === "bank" ? (
                            <Banknote className="size-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <CreditCard className="size-3.5 text-purple-600 shrink-0" />
                          )}
                          <span className="truncate">{t.user}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-medium text-green-600">
                            +{formatVND(t.amount)}đ
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alerts summary on overview */}
          {alertCounts.total > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-amber-50/50">
              <AlertTriangle className="size-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>{alertCounts.total}</strong> cảnh báo đang chờ xử lý
                {alertCounts.critical > 0 && (
                  <span>, trong đó <strong className="text-red-600">{alertCounts.critical}</strong> nghiêm trọng</span>
                )}
                . Chuyển sang tab <strong>Cảnh báo</strong> để xem chi tiết.
              </p>
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Alerts ─────────────────────────────────────── */}
        <TabsContent value="alerts" className="mt-4">
          <ReconAlertsPanel
            alerts={alerts}
            counts={alertCounts}
            loading={loading && alerts.length === 0}
          />
        </TabsContent>

        {/* ── Tab: Deposits ───────────────────────────────────── */}
        <TabsContent value="deposits" className="mt-4 space-y-4">
          {/* Filters */}
          <FilterBar
            showReset={
              filters.search !== "" || filters.status !== "" || filters.type !== ""
            }
            onReset={() =>
              setFilters({ search: "", status: "", type: "", page: 1, limit: 15 })
            }
          >
            <div className="flex-1 min-w-[200px]">
              <SearchBar
                placeholder="Tìm theo username hoặc email..."
                value={filters.search}
                onSearch={(v) => setFilters((p) => ({ ...p, search: v, page: 1 }))}
              />
            </div>
            <div className="w-[160px]">
              <FilterDropdown
                placeholder="Trạng thái"
                value={filters.status}
                onChange={(v) => setFilters((p) => ({ ...p, status: v, page: 1 }))}
                options={statusOptions}
              />
            </div>
            <div className="w-[160px]">
              <FilterDropdown
                placeholder="Loại"
                value={filters.type}
                onChange={(v) => setFilters((p) => ({ ...p, type: v, page: 1 }))}
                options={typeOptions}
              />
            </div>
          </FilterBar>

          {/* Table */}
          <DataTable
            columns={columns}
            data={deposits}
            loading={loading}
            pageSize={filters.limit}
            totalItems={pagination.totalItems}
            currentPage={pagination.currentPage}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            emptyState={
              <div className="py-12 text-center text-muted-foreground">
                <p className="font-medium">Không tìm thấy giao dịch</p>
                <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo giao dịch mới</p>
              </div>
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
