import { api } from "@/lib/adminAxios";
import type {
  Deposit,
  DepositListResponse,
  DepositType,
  UpdateDepositStatusPayload,
} from "@/types/admin/deposit.type";

export const depositService = {
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: DepositType;
    userId?: string;
    search?: string; // Tìm theo username/email
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const { data } = await api.get<DepositListResponse>("/admin/deposits", {
      params,
    });
    return data;
  },

  // Get chi tiết 1 giao dịch
  getById: async (id: string) => {
    const response = await api.get<{ deposit: Deposit }>(
      `/admin/deposits/${id}`,
    );
    return response.deposit;
  },

  //   Cập nhật trạng thái (Duyệt/Từ chối)
  updateStatus: async (id: string, payload: UpdateDepositStatusPayload) => {
    const data = await api.put<{ deposit: Deposit }>(
      `/admin/deposits/${id}/status`,
      payload,
    );
    return data.deposit;
  },

  exportCsv: async (filters?: Record<string, any>) => {
    const response = await api.get("/admin/deposits/export", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  },
};
