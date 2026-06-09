import { useCallback, useEffect, useRef, useState } from "react";

import { ReconKPICards } from "@/components/admin/reconciliation/ReconKPICards";
import { ReconAlertsPanel } from "@/components/admin/reconciliation/ReconAlertsPanel";
import { ReconCharts } from "@/components/admin/reconciliation/ReconCharts";
import { ReconMismatchPanel } from "@/components/admin/reconciliation/ReconMismatchPanel";
import { PageHeader, FilterBar, SearchBar, FilterDropdown, DataTable } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useReconSummaryQuery,
  useReconAlertsQuery,
  useReconDepositsQuery,
  useReconChartDataQuery,
} from "@/hooks/queries/useAdminQueries";
import { exportTableToCsv } from "@/hooks/useExportCsv";
import { cn, formatVND, formatDate } from "@/lib/utils";
import type { ReconDeposit } from "@/types/admin/reconciliation.type";
import type { ColumnDef } from "@tanstack/react-table";
import { EmptyState } from "@/components/ui/empty";
import {
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Banknote,
  CreditCard,
  Eye,
  Download,
  MoreHorizontal,
  SearchX,
  Pause,
  Play,
  GitCompareArrows,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queries/useAdminQueries";

// ── CSV columns for deposits export ────────────────────────────
const CSV_COLUMNS = [
  { key: "user.username", label: "Người dùng" },
  { key: "user.email", label: "Email" },
  { key: "type", label: "Loại" },
  { key: "status", label: "Trạng thái" },
  { key: "amount", label: "Số tiền" },
  { key: "declaredValue", label: "Giá trị khai báo" },
  { key: "referenceCode", label: "Mã tham chiếu" },
  { key: "createdAt", label: "Thời gian" },
];

// ── Status Badge ────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-200",
  PAID: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
  SUCCESS: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  FAILED: "bg-red-500/10 text-red-600 border-red-200",
  CANCELLED: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
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
const AUTO_REFRESH_INTERVAL = 30_000;
function toLocalDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const DEFAULT_DATE_FROM = toLocalDateStr(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
const DEFAULT_DATE_TO = toLocalDateStr(new Date());

export default function ReconciliationPage() {
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [chartFilters, setChartFilters] = useState({
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    dateTo: new Date().toISOString().slice(0, 10),
    type: "",
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: "",
    page: 1,
    limit: 15,
  });

  const { data: summaryData, isLoading: summaryLoading } = useReconSummaryQuery();
  const { data: alertsData } = useReconAlertsQuery();
  const { data: depositsData, isLoading: depositsLoading } = useReconDepositsQuery(filters);
  const { data: chartData, isLoading: chartLoading } = useReconChartDataQuery(chartFilters);

  const kpis = summaryData?.kpis || null;
  const alerts = alertsData?.alerts || [];
  const alertCounts = {
    total: alertsData?.total || 0,
    critical: alertsData?.critical || 0,
    warning: alertsData?.warning || 0,
  };
  const deposits: ReconDeposit[] = depositsData?.deposits || [];
  const pagination = {
    currentPage: depositsData?.currentPage || 1,
    totalPages: depositsData?.totalPages || 1,
    totalItems: depositsData?.totalItems || 0,
  };

  const loading = summaryLoading && !summaryData;
  const chartDateChanged = chartFilters.dateFrom !== DEFAULT_DATE_FROM || chartFilters.dateTo !== DEFAULT_DATE_TO;

  // ── Auto-refresh ──────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.reconciliation.summary });
    qc.invalidateQueries({ queryKey: queryKeys.reconciliation.alerts });
    qc.invalidateQueries({ queryKey: queryKeys.reconciliation.deposits() });
    qc.invalidateQueries({ queryKey: queryKeys.reconciliation.chartData() });
  }, [qc]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(handleRefresh, AUTO_REFRESH_INTERVAL);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, handleRefresh]);

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
      {/* Header */}
      <PageHeader
        title="Đối soát giao dịch"
        description="Tổng quan, cảnh báo và danh sách giao dịch nạp tiền"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                exportTableToCsv(
                  deposits.map((d) => ({
                    ...d,
                    amount: `${formatVND(d.amount)}đ`,
                    declaredValue: d.declaredValue ? `${formatVND(d.declaredValue)}đ` : "",
                    type: d.type === "bank" ? "Chuyển khoản" : "Thẻ cào",
                    status: statusLabels[d.status] || d.status,
                    createdAt: formatDate(d.createdAt),
                    user: d.user || { username: "N/A", email: "" },
                  })),
                  CSV_COLUMNS,
                  `reconciliation_deposits_${Date.now()}.csv`,
                )
              }
              disabled={deposits.length === 0}
            >
              <Download className="mr-2 size-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh((p) => !p)}
              className={cn(autoRefresh && "border-green-300 text-green-700")}
            >
              {autoRefresh ? <Pause className="mr-1 size-3" /> : <Play className="mr-1 size-3" />}
              {autoRefresh ? "Tự động" : "Tắt tự động"}
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={cn("mr-2 size-4", loading && "animate-spin")} />
              Làm mới
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="overview" className="text-xs">Tổng quan</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">
            Cảnh báo
            {alertCounts.total > 0 && (
              <Badge
                variant={alertCounts.critical > 0 ? "destructive" : "secondary"}
                className="ml-1.5 text-[9px] px-1 py-0 h-4"
              >
                {alertCounts.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="mismatches" className="text-xs">
            <GitCompareArrows className="size-3 mr-1" />
            Mismatches
          </TabsTrigger>
          <TabsTrigger value="deposits" className="text-xs">Danh sách giao dịch</TabsTrigger>
        </TabsList>

        {/* ── Tab: Overview ───────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-5 mt-4">
          {/* ── Alert Banner (priority: top) ──────────────────── */}
          {alertCounts.total > 0 && (
            <GlassCard className="p-3 border-amber-500/20 bg-amber-500/10" variant="subtle">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-400 truncate">
                    <strong>{alertCounts.total}</strong> cảnh báo đang chờ xử lý
                    {alertCounts.critical > 0 && (
                      <span>, <strong className="text-red-600">{alertCounts.critical}</strong> nghiêm trọng</span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 shrink-0"
                  onClick={() => setActiveTab("alerts")}
                >
                  <span className="hidden sm:inline">Xem chi tiết </span><ArrowRight className="size-3" />
                </Button>
              </div>
            </GlassCard>
          )}

          {/* ── KPI Cards ─────────────────────────────────────── */}
          <ReconKPICards kpis={kpis} loading={loading && !kpis} />

          {/* ── Chart Filters + Charts ────────────────────────── */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Phân tích</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={chartFilters.dateFrom}
                    onChange={(e) => setChartFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                    className="h-7 text-xs border rounded px-2 bg-background"
                  />
                  <span className="text-xs text-muted-foreground">→</span>
                  <input
                    type="date"
                    value={chartFilters.dateTo}
                    onChange={(e) => setChartFilters((p) => ({ ...p, dateTo: e.target.value }))}
                    className="h-7 text-xs border rounded px-2 bg-background"
                  />
                </div>
                <div className="w-[140px]">
                  <FilterDropdown
                    placeholder="Phương thức"
                    value={chartFilters.type}
                    onChange={(v) => setChartFilters((p) => ({ ...p, type: v }))}
                    options={typeOptions}
                  />
                </div>
                {(chartDateChanged || chartFilters.type !== "") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => setChartFilters({
                      dateFrom: DEFAULT_DATE_FROM,
                      dateTo: DEFAULT_DATE_TO,
                      type: "",
                    })}
                  >
                    Đặt lại
                  </Button>
                )}
              </div>
            </div>

            <ReconCharts
              timeSeries={chartData?.timeSeries}
              statusDistribution={chartData?.statusDistribution}
              topDepositors={chartData?.topDepositors}
              methodDistribution={chartData?.methodDistribution}
              loading={chartLoading}
            />
          </div>
        </TabsContent>

        {/* ── Tab: Alerts ─────────────────────────────────────── */}
        <TabsContent value="alerts" className="mt-4">
          <ReconAlertsPanel
            alerts={alerts}
            counts={alertCounts}
            loading={false}
          />
        </TabsContent>

        {/* ── Tab: Mismatches ────────────────────────────────── */}
        <TabsContent value="mismatches" className="mt-4">
          <ReconMismatchPanel />
        </TabsContent>

        {/* ── Tab: Deposits ───────────────────────────────────── */}
        <TabsContent value="deposits" className="mt-4 space-y-4">
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

          <DataTable
            columns={columns}
            data={deposits}
            loading={depositsLoading && !deposits.length}
            pageSize={filters.limit}
            totalItems={pagination.totalItems}
            currentPage={pagination.currentPage}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            emptyState={
              <EmptyState
                icon={SearchX}
                title="Không tìm thấy giao dịch"
                description="Thử thay đổi bộ lọc hoặc tạo giao dịch mới"
              />
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
