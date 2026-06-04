import { useCallback, useState } from "react";

import { ReconKPICards } from "@/components/admin/reconciliation/ReconKPICards";
import { ReconAlertsPanel } from "@/components/admin/reconciliation/ReconAlertsPanel";
import { PageHeader, FilterBar, SearchBar, FilterDropdown, DataTable } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useReconSummaryQuery,
  useReconAlertsQuery,
  useReconDepositsQuery,
} from "@/hooks/queries/useAdminQueries";
import { exportTableToCsv } from "@/hooks/useExportCsv";
import { cn, formatVND, formatDate } from "@/lib/utils";
import type { ReconDeposit } from "@/types/admin/reconciliation.type";
import type { ColumnDef } from "@tanstack/react-table";
import { SkeletonCard } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty";
import {
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Banknote,
  CreditCard,
  Eye,
  Download,
  MoreHorizontal,
  SearchX,
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
export default function ReconciliationPage() {
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
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

  const kpis = summaryData?.kpis || null;
  const depositMethods = summaryData?.depositMethods || [];
  const recentTransactions = summaryData?.recentTransactions || [];
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

  const handleRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.reconciliation.summary });
    qc.invalidateQueries({ queryKey: queryKeys.reconciliation.alerts });
    qc.invalidateQueries({ queryKey: queryKeys.reconciliation.deposits() });
  }, [qc]);

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
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={cn("mr-2 size-4", loading && "animate-spin")} />
              Làm mới
            </Button>
          </div>
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
          <ReconKPICards kpis={kpis} loading={loading && !kpis} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading && !depositMethods.length ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <GlassCard>
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
                </GlassCard>

                <GlassCard>
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
                </GlassCard>
              </>
            )}
          </div>

          {alertCounts.total > 0 && (
            <GlassCard className="p-3 border-amber-500/20 bg-amber-500/10" variant="subtle">
              <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>{alertCounts.total}</strong> cảnh báo đang chờ xử lý
                {alertCounts.critical > 0 && (
                  <span>, trong đó <strong className="text-red-600">{alertCounts.critical}</strong> nghiêm trọng</span>
                )}
                . Chuyển sang tab <strong>Cảnh báo</strong> để xem chi tiết.
              </p>
            </div>
            </GlassCard>
          )}
        </TabsContent>

        {/* ── Tab: Alerts ─────────────────────────────────────── */}
        <TabsContent value="alerts" className="mt-4">
          <ReconAlertsPanel
            alerts={alerts}
            counts={alertCounts}
            loading={false}
          />
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
