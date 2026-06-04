import { api } from "@/lib/adminAxios";
import type {
  AdjustBalancePayload,
  SearchUserItem,
  BalanceLogEntry,
} from "@/types/admin/userBalance.type";

export const userBalanceService = {
  /** Search users by username or email */
  search: async (query: string) => {
    const data = await api.get<SearchUserItem[]>("/users/search", {
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
    const data = await api.get<{
      user: {
        _id: string;
        username: string;
        email: string;
        displayName?: string;
        currentBalance: number;
      } | null;
      entries: BalanceLogEntry[];
      totalPages: number;
      currentPage: number;
      totalItems: number;
    }>(
      `/users/${userId}/balance-log`,
      { params },
    );
    return data;
  },

  /** Adjust a user's balance (credit or debit) */
  adjustBalance: async (userId: string, payload: AdjustBalancePayload) => {
    const data = await api.post<{
      userId: string;
      username: string;
      previousBalance: number;
      newBalance: number;
      adjustment: number;
      reason: string;
    }>(
      `/users/${userId}/balance-adjust`,
      payload,
    );
    return data;
  },
};
