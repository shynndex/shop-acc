import { api } from "@/lib/adminAxios";
import type {
  Deposit,
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
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const result = await api.get<{
      deposits: Deposit[];
      totalPages: number;
      currentPage: number;
      totalItems: number;
    }>("/deposits", {
      params,
    });
    return result;
  },

  // Get chi tiết 1 giao dịch
  getById: async (id: string) => {
    const result = await api.get<{ deposit: Deposit }>(
      `/deposits/${id}`,
    );
    return result.deposit;
  },

  //   Cập nhật trạng thái (Duyệt/Từ chối)
  updateStatus: async (id: string, payload: UpdateDepositStatusPayload) => {
    const result = await api.patch<{ deposit: Deposit }>(
      `/deposits/${id}/status`,
      payload,
    );
    return result.deposit;
  },

  exportCsv: async (filters?: Record<string, any>) => {
    const blob = await api.get<Blob>("/deposits/export", {
      params: filters,
      responseType: "blob",
    });
    return blob;
  },
};
