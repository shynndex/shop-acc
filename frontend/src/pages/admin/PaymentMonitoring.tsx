import { useCallback, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/admin/shared";
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeletons";
import { cn, formatVND, formatDate } from "@/lib/utils";
import {
  usePaymentSummaryQuery,
  usePaymentWebhookLogsQuery,
  usePaymentRecentQuery,
  usePaymentStatsQuery,
} from "@/hooks/queries/useAdminQueries";
import type {
  PaymentSummary,
  WebhookLog,
  RecentTransaction,
  PaymentStats,
} from "@/types/admin/paymentMonitor.type";
import {
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Activity,
  Webhook,
  Banknote,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
} from "lucide-react";

// ── Color helpers ────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-200",
  PAID: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
  SUCCESS: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  FAILED: "bg-red-500/10 text-red-600 border-red-200",
  CANCELLED: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PAID: "Đã thanh toán",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
};

// ── KPI Card ─────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  trend,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  colorClass: string;
  trend?: { direction: "up" | "down"; label: string };
}) {
  return (
    <GlassCard className="hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("size-9 sm:size-11 rounded-xl flex items-center justify-center shrink-0", colorClass)}>
              <Icon className="size-4 sm:size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight break-all sm:break-normal">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              {trend.direction === "up" ? (
                <ArrowUpRight className="size-3.5 text-green-500" />
              ) : (
                <ArrowDownRight className="size-3.5 text-red-500" />
              )}
              <span className={cn("font-medium", trend.direction === "up" ? "text-green-600 dark:text-green-400" : "text-red-600")}>
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </GlassCard>
  );
}

// ── Method badge icons ───────────────────────────────────────────

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    bank: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    card: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    payos: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
    purchase: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
  };

  const icons: Record<string, React.ReactNode> = {
    bank: <Banknote className="size-3" />,
    card: <CreditCard className="size-3" />,
    payos: <Globe className="size-3" />,
    purchase: <Globe className="size-3" />,
  };

  const labels: Record<string, string> = {
    bank: "CK",
    card: "Thẻ",
    payos: "PayOS",
    purchase: "Mua",
  };

  return (
    <Badge variant="outline" className={cn("gap-1 text-xs font-medium", colors[method] || "")}>
      {icons[method]}
      {labels[method] || method}
    </Badge>
  );
}

// ── Summary KPIs ─────────────────────────────────────────────────

function SummarySection({ summary }: { summary: PaymentSummary }) {
  const { today, month } = summary;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-[400ms]" style={{ animationDelay: "0ms" }}>
        <KpiCard
          title="Giao dịch hôm nay"
          value={today.totalCount.toLocaleString("vi-VN")}
          subtitle={`Thành công: ${today.successCount}`}
          icon={Activity}
          colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
        />
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-[400ms]" style={{ animationDelay: "50ms" }}>
        <KpiCard
          title="Doanh thu hôm nay"
          value={`${formatVND(today.totalAmount)}đ`}
          subtitle={`Bank: ${formatVND(today.breakdown.bank.amount)}đ`}
          icon={DollarSign}
          colorClass="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
        />
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-[400ms]" style={{ animationDelay: "100ms" }}>
        <KpiCard
          title="Tỉ lệ thành công"
          value={`${today.successRate}%`}
          subtitle={`${today.successCount}/${today.totalCount} giao dịch`}
          icon={TrendingUp}
          colorClass={today.successRate >= 80 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"}
        />
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-[400ms]" style={{ animationDelay: "150ms" }}>
        <KpiCard
          title="Đang chờ xử lý"
          value={today.pendingCount.toLocaleString("vi-VN")}
          subtitle={`Webhook: ${today.webhookCount}`}
          icon={Clock}
          colorClass={today.pendingCount > 0 ? "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground"}
        />
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-[400ms]" style={{ animationDelay: "200ms" }}>
        <KpiCard
          title="Tháng này"
          value={`${formatVND(month.totalAmount)}đ`}
          subtitle={`${month.totalCount} giao dịch`}
          icon={BarChart3}
          colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
        />
      </div>
    </div>
  );
}

// ── Summary Loading ──────────────────────────────────────────────

function SummaryLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ── Webhook Activity Feed ────────────────────────────────────────

function WebhookFeed({ webhooks }: { webhooks: WebhookLog[] }) {
  const webhookIcon = (type: string) => {
    switch (type) {
      case "payos":
      case "payos_purchase":
        return <Globe className="size-4" />;
      case "card":
        return <CreditCard className="size-4" />;
      default:
        return <Webhook className="size-4" />;
    }
  };

  const webhookColor = (type: string) => {
    switch (type) {
      case "payos":
      case "payos_purchase":
        return "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400";
      case "card":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getDescription = (w: WebhookLog) => {
    if (w.type === "card") {
      const status = w.status === "SUCCESS" ? "thành công" : w.status === "FAILED" ? "thất bại" : w.status;
      return `Webhook thẻ ${w.provider} — ${status}${w.isAmountMismatch ? " (lệch mệnh giá)" : ""}`;
    }
    const status = w.status === "PAID" ? "đã thanh toán" : w.status === "FAILED" ? "thất bại" : w.status;
    return `Webhook PayOS — ${status} — ${w.referenceCode || ""}`;
  };

  return (
    <div className="space-y-3">
      {webhooks.length === 0 ? (
        <EmptyState
          icon={Webhook}
          title="Chưa có webhook nào"
          description="Webhook sẽ xuất hiện khi có giao dịch được xử lý"
        />
      ) : (
        webhooks.slice(0, 15).map((w, idx) => (
          <div
            key={w.id}
            className="animate-in fade-in slide-in-from-left-1 duration-300 flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", webhookColor(w.type))}>
              {webhookIcon(w.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{getDescription(w)}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatDate(w.webhookReceivedAt)}
                </span>
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", statusColors[w.status] || "")}>
                  {statusLabels[w.status] || w.status}
                </Badge>
                {w.amount > 0 && (
                  <span className="text-xs font-medium text-green-600">
                    +{formatVND(w.amount)}đ
                  </span>
                )}
              </div>
              {w.user && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {w.user.displayName || w.user.username || "Unknown"}
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Recent Transactions Table ────────────────────────────────────

function RecentTransactionsTable({ transactions }: { transactions: RecentTransaction[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Phương thức</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Người dùng</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider text-right">Số tiền</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Trạng thái</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Mã GD</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider text-right">Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-6">
                <EmptyState
                  icon={Banknote}
                  title="Chưa có giao dịch"
                  className="py-6"
                />
              </td>
            </tr>
          ) : (
            transactions.slice(0, 10).map((tx, idx) => (
              <tr key={tx.id} className="animate-in fade-in duration-300 border-b last:border-0 hover:bg-accent/50 transition-colors" style={{ animationDelay: `${idx * 50}ms` }}>
                <td className="py-2.5">
                  <MethodBadge method={tx.type} />
                </td>
                <td className="py-2.5">
                  <span className="font-medium">{tx.user?.displayName || tx.user?.username || "N/A"}</span>
                </td>
                <td className="py-2.5 text-right">
                  <span className={cn("font-semibold", tx.type === "bank" || tx.type === "payos" ? "text-green-600" : "text-purple-600")}>
                    +{formatVND(tx.amount)}đ
                  </span>
                  {tx.isAmountMismatch && (
                    <AlertTriangle className="size-3 inline ml-1 text-amber-500" />
                  )}
                </td>
                <td className="py-2.5">
                  <Badge variant="outline" className={cn("text-[11px] px-2 py-0", statusColors[tx.status] || "")}>
                    {statusLabels[tx.status] || tx.status}
                  </Badge>
                </td>
                <td className="py-2.5">
                  <span className="font-mono text-xs text-muted-foreground">{tx.referenceCode}</span>
                </td>
                <td className="py-2.5 text-right">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(tx.createdAt)}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Stats Section ────────────────────────────────────────────────

function StatsSection({ stats }: { stats: PaymentStats }) {
  const totalAll =
    Object.values(stats.statusDistribution).reduce((a, b) => a + b, 0) || 1;
  const statusEntries = Object.entries(stats.statusDistribution).sort(
    ([, a], [, b]) => b - a,
  );

  const statusIcons: Record<string, React.ElementType> = {
    PENDING: Clock,
    PAID: CheckCircle,
    SUCCESS: CheckCircle,
    FAILED: XCircle,
    CANCELLED: XCircle,
  };

  const statusBarColors: Record<string, string> = {
    PENDING: "bg-amber-500",
    PAID: "bg-green-500",
    SUCCESS: "bg-emerald-500",
    FAILED: "bg-red-500",
    CANCELLED: "bg-gray-400",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status Distribution */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-base">Phân bố trạng thái</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusEntries.map(([status, count]) => {
            const Icon = statusIcons[status] || Activity;
            const pct = Math.round((count / totalAll) * 100);
            return (
              <div key={status} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <span>{statusLabels[status] || status}</span>
                  </div>
                  <span className="font-medium">
                    {count.toLocaleString("vi-VN")} ({pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", statusBarColors[status] || "bg-gray-400 dark:bg-gray-600")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </GlassCard>

      {/* Method & Provider Breakdown */}
      <div className="space-y-4">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-base">Phương thức thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Banknote className="size-4 text-blue-700 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Chuyển khoản</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.methodBreakdown.bank.count.toLocaleString("vi-VN")} giao dịch
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatVND(stats.methodBreakdown.bank.totalAmount)}đ</p>
                  <p className="text-xs text-muted-foreground">TB: {formatVND(stats.methodBreakdown.bank.avgAmount)}đ</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <CreditCard className="size-4 text-purple-700 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Thẻ cào</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.methodBreakdown.card.count.toLocaleString("vi-VN")} giao dịch
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{formatVND(stats.methodBreakdown.card.totalAmount)}đ</p>
                  <p className="text-xs text-muted-foreground">TB: {formatVND(stats.methodBreakdown.card.avgAmount)}đ</p>
                </div>
              </div>
            </div>
          </CardContent>
        </GlassCard>

        {stats.providerBreakdown.length > 0 && (
          <GlassCard>
            <CardHeader>
              <CardTitle className="text-base">Nhà mạng thẻ cào</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.providerBreakdown.map((p) => (
                  <div key={p._id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{p._id}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{p.count.toLocaleString("vi-VN")} GD</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400 w-24 text-right">
                        {formatVND(p.totalAmount)}đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        )}

        {stats.dailyVolume.length > 0 && (
          <GlassCard>
            <CardHeader>
              <CardTitle className="text-base">7 ngày qua</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-24">
                {stats.dailyVolume.map((d) => {
                  const maxAmount = Math.max(...stats.dailyVolume.map((x) => x.bankAmount + x.cardAmount), 1);
                  const total = d.bankAmount + d.cardAmount;
                  const height = (total / maxAmount) * 100;
                  const dayLabel = new Date(d.date + "T00:00:00").toLocaleDateString("vi-VN", { weekday: "narrow" });
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <div className="w-full flex flex-col-reverse" style={{ height: `${height}%` }}>
                        {d.cardAmount > 0 && (
                          <div
                            className="w-full rounded-t bg-purple-400/70 hover:bg-purple-500 transition-all"
                            style={{ height: `${(d.cardAmount / total) * 100}%` }}
                            title={`Thẻ: ${formatVND(d.cardAmount)}đ`}
                          />
                        )}
                        {d.bankAmount > 0 && (
                          <div
                            className="w-full bg-blue-400/70 hover:bg-blue-500 transition-all"
                            style={{ height: d.cardAmount > 0 ? `${(d.bankAmount / total) * 100}%` : "100%" }}
                            title={`CK: ${formatVND(d.bankAmount)}đ`}
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────

export default function PaymentMonitoringPage() {
  const [error, setError] = useState<string | null>(null);

  const {
    data: summary,
    isLoading: summaryLoading,
    isFetching: summaryFetching,
    refetch: refetchSummary,
  } = usePaymentSummaryQuery();

  const {
    data: webhookData,
    isLoading: webhookLoading,
    refetch: refetchWebhooks,
  } = usePaymentWebhookLogsQuery({ limit: 50 });

  const {
    data: txData,
    isLoading: txLoading,
    refetch: refetchTx,
  } = usePaymentRecentQuery();

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = usePaymentStatsQuery();

  const loading = summaryLoading && !summary;
  const webhooks = webhookData?.webhooks || [];
  const transactions = txData?.transactions || [];
  const hasData = summary !== null;

  const handleRefresh = useCallback(() => {
    refetchSummary();
    refetchWebhooks();
    refetchTx();
    refetchStats();
  }, [refetchSummary, refetchWebhooks, refetchTx, refetchStats]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Giám sát thanh toán"
        description="Theo dõi trạng thái giao dịch, webhook và thống kê thanh toán"
        actions={
          <Button variant="outline" onClick={handleRefresh} disabled={summaryFetching}>
            <RefreshCw className={cn("mr-2 size-4", summaryFetching && "animate-spin")} />
            Làm mới
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && !hasData ? <SummaryLoading /> : summary && <SummarySection summary={summary} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Webhook className="size-4" />
              Webhook gần đây
            </CardTitle>
            {!webhookLoading && (
              <Badge variant="secondary" className="text-xs">
                {webhooks.length} webhook
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {webhookLoading && !webhooks.length ? (
              <SkeletonTable rows={5} cols={3} />
            ) : (
              <WebhookFeed webhooks={webhooks} />
            )}
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="size-4" />
              Giao dịch gần đây
            </CardTitle>
            {!txLoading && (
              <Badge variant="secondary" className="text-xs">
                {transactions.length} GD
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {txLoading && !transactions.length ? (
              <SkeletonTable rows={5} cols={6} />
            ) : (
              <RecentTransactionsTable transactions={transactions} />
            )}
          </CardContent>
        </GlassCard>
      </div>

      {statsLoading && !stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        stats && <StatsSection stats={stats} />
      )}
    </div>
  );
}
