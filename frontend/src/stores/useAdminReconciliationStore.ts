import { reconciliationService } from "@/services/admin/reconciliation.service";
import type { ReconciliationState } from "@/types/admin/reconciliation.type";
import { create } from "zustand";

export const useAdminReconciliationStore = create<ReconciliationState>((set, get) => ({
  kpis: null,
  depositMethods: [],
  recentTransactions: [],
  alerts: [],
  alertCounts: { total: 0, critical: 0, warning: 0 },
  deposits: [],
  pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
  loading: false,
  error: null,

  fetchSummary: async () => {
    set({ loading: true, error: null });
    try {
      const data = await reconciliationService.summary();
      set({
        kpis: data.kpis,
        depositMethods: data.depositMethods,
        recentTransactions: data.recentTransactions,
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err?.message || "Không thể tải dữ liệu tổng quan",
        loading: false,
      });
    }
  },

  fetchAlerts: async () => {
    try {
      const data = await reconciliationService.alerts();
      set({
        alerts: data.alerts,
        alertCounts: { total: data.total, critical: data.critical, warning: data.warning },
      });
    } catch {
      // Silently fail — alerts are supplementary
    }
  },

  fetchDeposits: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await reconciliationService.deposits(params);
      set({
        deposits: data.deposits,
        pagination: {
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalItems: data.totalItems,
        },
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err?.message || "Không thể tải danh sách giao dịch",
        loading: false,
      });
    }
  },
}));
