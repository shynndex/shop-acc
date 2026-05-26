"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download } from "lucide-react";
import { GameDistributionChart } from "@/components/admin/analytics/GameDistributionChart";
import { RecentActivityTable } from "@/components/admin/analytics/RecentActivityTable";
import { DateRangeFilter } from "@/components/admin/analytics/DateRangeFilter";
import { PageHeader } from "@/components/admin/shared";
import { useAdminAnalyticsStore } from "@/stores/useAdminAnalyticsStore.ts";
import KpiCard from "@/components/admin/analytics/KpiCard";
import RevenueChart from "@/components/admin/analytics/RevenueChart";

export default function AdminAnalyticsPage() {
  const {
    kpis,
    revenueTrend,
    gameDistribution,
    recentActivities,
    loading,
    error,
    dateRange,
    fetchDashboard,
    setDateRange,
  } = useAdminAnalyticsStore();

  const [tempDateRange, setTempDateRange] = useState(dateRange);

  // Fetch data khi mount hoặc dateRange thay đổi
  useEffect(() => {
    fetchDashboard();
  }, []); // Chỉ fetch lần đầu, các lần sau dùng button refresh

  const handleApplyDateRange = () => {
    setDateRange(tempDateRange.from, tempDateRange.to);
  };

  const handleExport = () => {
    // TODO: Implement export PDF/CSV
    alert("Tính năng export đang được phát triển!");
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Header */}
      <PageHeader
        title="Analytics Dashboard"
        description="Tổng quan doanh thu, hoạt động và xu hướng kinh doanh"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => fetchDashboard()}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </>
        }
      />

      {/* Date Range Filter */}
      <DateRangeFilter
        from={tempDateRange.from}
        to={tempDateRange.to}
        onFromChange={(from) => setTempDateRange((prev) => ({ ...prev, from }))}
        onToChange={(to) => setTempDateRange((prev) => ({ ...prev, to }))}
        onApply={handleApplyDateRange}
        loading={loading}
      />

      {/* KPI Cards Grid */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard metric={kpis.totalRevenue} />
          <KpiCard metric={kpis.totalOrders} />
          <KpiCard metric={kpis.newUsers} />
          <KpiCard metric={kpis.activeAccounts} />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={revenueTrend} loading={loading} />
        <GameDistributionChart data={gameDistribution} loading={loading} />
      </div>

      {/* Recent Activities */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Hoạt động gần đây</h3>
        <RecentActivityTable activities={recentActivities} loading={loading} />
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-700">
          <strong>Lỗi:</strong> {error}
        </div>
      )}
    </div>
  );
}
