export interface KpiMetric {
  label: string;
  value: number | string;
  change?: number; // % thay đổi so với kỳ trước (+/-)
  trend?: "up" | "down" | "neutral";
  icon?: string;
  suffix?: string; // "đ", "user", "order"...
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders?: number;
  newUsers?: number;
}

export interface GameDistribution {
  game: string;
  label: string;
  count: number;
  revenue?: number;
  color?: string;
}

export interface DepositMethodData {
  method: "bank" | "card";
  label: string;
  count: number;
  totalAmount: number;
  color?: string;
}

export interface ActivityItem {
  id: string;
  type: "deposit" | "account_created" | "account_sold" | "user_registered";
  description: string;
  amount?: number;
  user?: { username: string; email?: string };
  createdAt: string;
}

// Full dashboard response
export interface AnalyticsDashboardResponse {
  success: boolean;
  data: {
    dateRange: {
      from: string;
      to: string;
    };

    kpis: {
      totalRevenue: KpiMetric;
      totalOrders: KpiMetric;
      newUsers: KpiMetric;
      activeAccounts: KpiMetric;
    };

    revenueTrend: RevenueDataPoint[];
    gameDistribution: GameDistribution[];
    depositMethods: DepositMethodData[];

    recentActivities: ActivityItem[];
  };
}

// Request params
export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  game?: string;
}
