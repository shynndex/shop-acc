import { analyticsService } from "@/services/admin/analytics.service";
import type { AdminAnalyticsState } from "@/types/admin/store.type";
import { toast } from "sonner";
import { create } from "zustand/react";

export const useAdminAnalyticsStore = create<AdminAnalyticsState>(
  (set, get) => ({
    kpis: null,
    revenueTrend: [],
    gameDistribution: [],
    depositMethods: [],
    recentActivities: [],
    loading: false,
    error: null,
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      to: new Date().toISOString().split("T")[0],
    },

    fetchDashboard: async (filters) => {
      set({ loading: true, error: null });
      try {
        const data = await analyticsService.getDashboard({
          ...get().dateRange,
          ...filters,
        });

        set({
          kpis: data.kpis,
          revenueTrend: data.revenueTrend,
          gameDistribution: data.gameDistribution,
          depositMethods: data.depositMethods,
          recentActivities: data.recentActivities,
          dateRange: data.dateRange,
          loading: false,
        });
      } catch (err: any) {
        set({
          error: err.message || "Không thể tải dashboard",
          loading: false,
        });
        toast.error("Lỗi khi tải analytics");
      }
    },

    refreshRevenue: async (filters) => {
      try {
        const data = await analyticsService.getRevenueTrend({
          ...get().dateRange,
          ...filters,
        });
        set({ revenueTrend: data });
      } catch (error) {
        toast.error("Không thể refresh biểu đồ doanh thu");
      }
    },

    setDateRange: (from, to) => {
      set({ dateRange: { from, to } });
      get().fetchDashboard();
    },
  }),
);
