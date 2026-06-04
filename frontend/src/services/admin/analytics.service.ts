import { api } from "@/lib/adminAxios";
import type {
  AnalyticsDashboardResponse,
  AnalyticsFilters,
  RevenueDataPoint,
} from "@/types/admin/analytics.type";

export const analyticsService = {
  /**
   * Fetch toàn bộ dashboard data với filters
   */
  getDashboard: async (filters?: AnalyticsFilters) => {
    const data = await api.get<AnalyticsDashboardResponse>(
      "/analytics/dashboard",
      { params: filters },
    );
    return data;
  },

  /**
   * Fetch riêng revenue trend (để refresh chart khi đổi date range)
   */
  getRevenueTrend: async (filters?: AnalyticsFilters) => {
    const data = await api.get<RevenueDataPoint[]>(
      "/analytics/revenue-trend",
      { params: filters },
    );
    return data;
  },
};
