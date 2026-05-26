import { api } from "@/lib/adminAxios";
import type {
  ReconSummaryResponse,
  ReconDepositsResponse,
  ReconAlertsResponse,
} from "@/types/admin/reconciliation.type";

export const reconciliationService = {
  summary: async () => {
    const data = await api.get<ReconSummaryResponse>("/admin/reconciliation/summary");
    return data;
  },

  deposits: async (params?: Record<string, any>) => {
    const data = await api.get<ReconDepositsResponse>("/admin/reconciliation/deposits", { params });
    return data;
  },

  alerts: async () => {
    const data = await api.get<ReconAlertsResponse>("/admin/reconciliation/alerts");
    return data;
  },
};
