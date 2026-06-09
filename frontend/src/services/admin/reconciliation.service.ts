import { api } from "@/lib/adminAxios";
import type {
  ReconSummaryResponse,
  ReconDepositsResponse,
  ReconAlertsResponse,
  ReconChartDataResponse,
  ReconMismatchesResponse,
} from "@/types/admin/reconciliation.type";

export const reconciliationService = {
  summary: async () => {
    const data = await api.get<ReconSummaryResponse["data"]>("/reconciliation/summary");
    return data;
  },

  deposits: async (params?: Record<string, any>) => {
    const data = await api.get<ReconDepositsResponse["data"]>("/reconciliation/deposits", { params });
    return data;
  },

  alerts: async () => {
    const data = await api.get<ReconAlertsResponse["data"]>("/reconciliation/alerts");
    return data;
  },

  chartData: async (params?: Record<string, any>) => {
    const data = await api.get<ReconChartDataResponse["data"]>("/reconciliation/chart-data", { params });
    return data;
  },

  mismatches: async (params?: Record<string, any>) => {
    const data = await api.get<ReconMismatchesResponse["data"]>("/reconciliation/mismatches", { params });
    return data;
  },

  resolveMismatch: async (id: string) => {
    const data = await api.patch(`/reconciliation/mismatches/${id}/resolve`);
    return data;
  },
};
