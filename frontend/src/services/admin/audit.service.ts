import { api } from "@/lib/adminAxios";
import type { AuditLogListResponse } from "@/types/admin/audit.type";

export const auditService = {
  list: async (params?: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const data = await api.get<AuditLogListResponse>("/audit-logs", {
      params,
    });
    return data;
  },

  exportCsv: async (filters?: Record<string, any>) => {
    const blob = await api.get<Blob>("/audit-logs/export", {
      params: filters,
      responseType: "blob",
    });
    return blob;
  },
};
