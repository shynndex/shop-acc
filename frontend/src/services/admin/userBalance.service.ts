import { api } from "@/lib/adminAxios";
import type {
  BalanceLogResponse,
  AdjustBalancePayload,
  AdjustBalanceResponse,
  SearchUserResponse,
} from "@/types/admin/userBalance.type";

export const userBalanceService = {
  /** Search users by username or email */
  search: async (query: string) => {
    const data = await api.get<SearchUserResponse>("/admin/users/search", {
      params: { q: query },
    });
    return data;
  },

  /** Get balance log for a user */
  getBalanceLog: async (
    userId: string,
    params?: {
      page?: number;
      limit?: number;
      dateFrom?: string;
      dateTo?: string;
    },
  ) => {
    const data = await api.get<BalanceLogResponse>(
      `/admin/users/${userId}/balance-log`,
      { params },
    );
    return data;
  },

  /** Adjust a user's balance (credit or debit) */
  adjustBalance: async (userId: string, payload: AdjustBalancePayload) => {
    const data = await api.post<AdjustBalanceResponse>(
      `/admin/users/${userId}/balance-adjust`,
      payload,
    );
    return data;
  },
};
