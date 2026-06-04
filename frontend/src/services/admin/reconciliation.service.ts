import { api } from "@/lib/adminAxios";
import type {
  ReconSummaryResponse,
  ReconDepositsResponse,
  ReconAlertsResponse,
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
};
