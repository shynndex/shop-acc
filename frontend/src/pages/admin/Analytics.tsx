"use client";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { SkeletonCardGrid, SkeletonChart, SkeletonList } from "@/components/ui/skeletons";
import { RefreshCw, Download } from "lucide-react";
import { RecentActivityTable } from "@/components/admin/analytics/RecentActivityTable";
import { DateRangeFilter } from "@/components/admin/analytics/DateRangeFilter";
import { PageHeader } from "@/components/admin/shared";
import { useDashboardQuery } from "@/hooks/queries/useAdminQueries";
import KpiCard from "@/components/admin/analytics/KpiCard";
import { lazy, Suspense, useState } from "react";

// Lazy-load recharts-based chart components
const LazyRevenueChart = lazy(() => import("@/components/admin/analytics/RevenueChart"));
const LazyGameDistributionChart = lazy(() =>
  import("@/components/admin/analytics/GameDistributionChart").then(
    (m) => ({ default: m.GameDistributionChart })
  )
);

export default function AdminAnalyticsPage() {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useDashboardQuery();

  const kpis = data?.kpis || null;
  const revenueTrend = data?.revenueTrend || [];
  const gameDistribution = data?.gameDistribution || [];
  const recentActivities = data?.recentActivities || [];

  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [tempDateRange, setTempDateRange] = useState({ from: "", to: "" });

  const handleApplyDateRange = () => {
    setDateRange(tempDateRange.from, tempDateRange.to);
  };

  // Refetch with date range when it changes
  // Note: The existing analytics API doesn't support date range filtering
  // This is a placeholder for future enhancement

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Analytics Dashboard"
        description="Tổng quan doanh thu, hoạt động và xu hướng kinh doanh"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
            <Button variant="outline" disabled>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </>
        }
      />

      <DateRangeFilter
        from={tempDateRange.from}
        to={tempDateRange.to}
        onFromChange={(from) => setTempDateRange((prev) => ({ ...prev, from }))}
        onToChange={(to) => setTempDateRange((prev) => ({ ...prev, to }))}
        onApply={handleApplyDateRange}
        loading={isLoading}
      />

      {kpis ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard metric={kpis.totalRevenue} />
          <KpiCard metric={kpis.totalOrders} />
          <KpiCard metric={kpis.newUsers} />
          <KpiCard metric={kpis.activeAccounts} />
        </div>
      ) : isLoading ? (
        <SkeletonCardGrid count={4} />
      ) : null}

      {revenueTrend.length > 0 || gameDistribution.length > 0 || isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<SkeletonChart />}>
            <LazyRevenueChart data={revenueTrend} loading={isLoading} />
          </Suspense>
          <Suspense fallback={<SkeletonChart />}>
            <LazyGameDistributionChart data={gameDistribution} loading={isLoading} />
          </Suspense>
        </div>
      ) : null}

      {recentActivities.length > 0 || isLoading ? (
        <GlassCard className="p-4">
          <h3 className="text-lg font-semibold mb-4">Hoạt động gần đây</h3>
          {isLoading ? (
            <SkeletonList rows={5} />
          ) : (
            <RecentActivityTable activities={recentActivities} loading={false} />
          )}
        </GlassCard>
      ) : null}

      {error && (
        <div className="p-4 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 rounded-lg text-red-700 dark:text-red-400">
          <strong>Lỗi:</strong> {(error as any)?.message || "Không thể tải dữ liệu"}
        </div>
      )}
    </div>
  );
}
