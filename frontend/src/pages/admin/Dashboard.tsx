import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SkeletonCard, SkeletonChart, SkeletonDistribution, SkeletonList } from "@/components/ui/skeletons";
import { cn, formatVND, formatDate } from "@/lib/utils";
import { useDashboardQuery } from "@/hooks/queries/useAdminQueries";
import type {
  KpiMetric,
  RevenueDataPoint,
  GameDistribution,
  ActivityItem,
} from "@/types/admin/analytics.type";
import { PageHeader } from "@/components/admin/shared";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Gamepad2,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Banknote,
  CreditCard,
  Clock,
  UserPlus,
  Package,
} from "lucide-react";

// ── KPI Card ────────────────────────────────────────────────────
function KpiCard({
  metric,
  loading,
  icon: Icon,
  colorClass,
}: {
  metric: KpiMetric | null;
  loading: boolean;
  icon: React.ElementType;
  colorClass: string;
}) {
  if (loading || !metric) {
    return <SkeletonCard />;
  }

  return (
    <GlassCard className="hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "size-8 sm:size-10 rounded-lg flex items-center justify-center shrink-0",
                colorClass,
              )}
            >
              <Icon className="size-4 sm:size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight break-all sm:break-normal">
                {typeof metric.value === "number"
                  ? metric.suffix === "đ"
                    ? `${formatVND(metric.value)}đ`
                    : metric.value.toLocaleString("vi-VN")
                  : metric.value}
              </p>
            </div>
          </div>
          {metric.change !== undefined && (
            <div className="flex items-center gap-1">
              {metric.trend === "up" ? (
                <ArrowUpRight className="size-4 text-green-500" />
              ) : metric.trend === "down" ? (
                <ArrowDownRight className="size-4 text-red-500" />
              ) : null}
              <span
                className={cn(
                  "text-sm font-medium",
                  metric.trend === "up"
                    ? "text-green-600"
                    : metric.trend === "down"
                      ? "text-red-600"
                      : "text-muted-foreground",
                )}
              >
                {metric.change > 0 ? "+" : ""}
                {metric.change}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </GlassCard>
  );
}

// ── Mini Revenue Chart (sparkline-like bar chart) ───────────────
function RevenueSparkline({
  data,
  loading,
}: {
  data: RevenueDataPoint[];
  loading: boolean;
}) {
  if (loading) return <SkeletonChart height={40} className="border-0" />;
  if (!data.length) return null;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const points = data.slice(-14);

  return (
    <div className="h-40 flex items-end gap-[2px]">
      {points.map((point, i) => {
        const height = (point.revenue / maxRevenue) * 100;
        return (
          <div
            key={i}
            className="flex-1 relative group cursor-pointer"
            title={`${formatDate(point.date)}: ${formatVND(point.revenue)}đ`}
          >
            <div
              className="absolute bottom-0 left-0 right-0 rounded-t bg-gradient-to-t from-blue-500/80 to-blue-400/60 hover:from-blue-600 hover:to-blue-500 transition-all duration-150"
              style={{ height: `${Math.max(height, 2)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Game Distribution ───────────────────────────────────────────
function GameDistributionCard({
  data,
  loading,
}: {
  data: GameDistribution[];
  loading: boolean;
}) {
  if (loading) {
    return <SkeletonDistribution />;
  }

  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  if (!totalCount) return null;

  const gameLabels: Record<string, string> = {
    "lien-quan": "Liên Quân",
    "lien-minh": "Liên Minh",
    valorant: "Valorant",
    "free-fire": "Free Fire",
    khac: "Khác",
  };

  const gameColors: Record<string, string> = {
    "lien-quan": "bg-amber-500",
    "lien-minh": "bg-blue-500",
    valorant: "bg-red-500",
    "free-fire": "bg-green-500",
    khac: "bg-gray-400 dark:bg-gray-600",
  };

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="text-base">Phân bố game</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => {
            const pct = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
            return (
              <div key={item.game} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {gameLabels[item.game] || item.game}
                  </span>
                  <span className="text-muted-foreground">
                    {item.count} ({Math.round(pct)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      gameColors[item.game] || "bg-gray-400",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </GlassCard>
  );
}

// ── Recent Activity ─────────────────────────────────────────────
function RecentActivity({
  activities,
  loading,
}: {
  activities: ActivityItem[];
  loading: boolean;
}) {
  const typeIcons: Record<string, React.ElementType> = {
    account_sold: ShoppingCart,
    deposit: Banknote,
    user_registered: UserPlus,
    account_created: Package,
  };

  const typeColors: Record<string, string> = {
    account_sold: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/50",
    deposit: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50",
    user_registered: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/50",
    account_created: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50",
  };

  if (loading) {
    return <SkeletonList rows={5} />;
  }

  if (!activities.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p className="text-sm">Chưa có hoạt động nào gần đây</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = typeIcons[activity.type] || Clock;
        const colorClass = typeColors[activity.type] || "text-muted-foreground bg-muted/50";
        return (
          <div
            key={activity.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
          >
            <div
              className={cn(
                "size-8 rounded-full flex items-center justify-center shrink-0",
                colorClass,
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {activity.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {activity.user?.username || ""}
                {activity.amount
                  ? ` — ${formatVND(activity.amount)}đ`
                  : ""}
              </p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDate(activity.createdAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Quick Actions ───────────────────────────────────────────────
const quickActions = [
  { label: "Quản lý tài khoản", href: "/admin/accounts", icon: Gamepad2 },
  { label: "Đơn hàng", href: "/admin/orders", icon: ShoppingCart },
  { label: "Giao dịch nạp", href: "/admin/deposits", icon: CreditCard },
  { label: "Phân tích", href: "/admin/analytics", icon: TrendingUp },
];

// ── Main Dashboard ──────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useDashboardQuery();

  const loading = isLoading && !data;
  const kpis = data?.kpis || null;
  const revenueTrend = data?.revenueTrend || [];
  const gameDistribution = data?.gameDistribution || [];
  const recentActivities = data?.recentActivities || [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <PageHeader
        title="Tổng quan"
        description="Tổng quan doanh thu và hoạt động của hệ thống"
        showSeparator={false}
        actions={
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("mr-2 size-4", isFetching && "animate-spin")}
            />
            Làm mới
          </Button>
        }
      />

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{(error as any)?.message || "Không thể tải dữ liệu dashboard"}</AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          metric={kpis?.totalRevenue || null}
          loading={loading}
          icon={DollarSign}
          colorClass="bg-green-100 text-green-700"
        />
        <KpiCard
          metric={kpis?.totalOrders || null}
          loading={loading}
          icon={ShoppingCart}
          colorClass="bg-blue-100 text-blue-700"
        />
        <KpiCard
          metric={kpis?.newUsers || null}
          loading={loading}
          icon={Users}
          colorClass="bg-purple-100 text-purple-700"
        />
        <KpiCard
          metric={kpis?.activeAccounts || null}
          loading={loading}
          icon={Gamepad2}
          colorClass="bg-amber-100 text-amber-700"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <GlassCard className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Doanh thu 14 ngày</span>
              {revenueTrend.length > 0 && (
                <span className="text-lg font-bold text-green-600">
                  {formatVND(
                    revenueTrend.reduce((s, d) => s + d.revenue, 0),
                  )}
                  đ
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueSparkline data={revenueTrend} loading={loading} />
          </CardContent>
        </GlassCard>

        {/* Game Distribution */}
        <GameDistributionCard
          data={gameDistribution}
          loading={loading}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <GlassCard className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity
              activities={recentActivities}
              loading={loading}
            />
          </CardContent>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-base">Truy cập nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                variant="outline"
                className="w-full justify-start h-11"
                onClick={() => navigate(action.href)}
              >
                <action.icon className="mr-3 size-4" />
                {action.label}
              </Button>
            ))}
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
