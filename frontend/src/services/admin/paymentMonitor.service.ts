import { api } from "@/lib/adminAxios";
import type { PaymentSummary, WebhookLogsResponse, RecentTransactionsResponse, PaymentStats } from "@/types/admin/paymentMonitor.type";

export const paymentMonitorService = {
  getSummary: async () => {
    return api.get<PaymentSummary>("/payments-monitor/summary");
  },

  getWebhookLogs: async (params?: { page?: number; limit?: number }) => {
    return api.get<WebhookLogsResponse>("/payments-monitor/webhook-logs", { params });
  },

  getRecentTransactions: async (params?: { limit?: number }) => {
    return api.get<RecentTransactionsResponse>("/payments-monitor/recent", { params });
  },

  getStats: async () => {
    return api.get<PaymentStats>("/payments-monitor/stats");
  },
};
