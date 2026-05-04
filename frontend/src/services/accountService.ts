import { api } from "@/lib/clientAxios";
import type { Account } from "@/types";
import type { AccountListResponse, GetAccountsParams } from "@/types/client/services";

export const accountService = {
  /**
   * Lấy danh sách tài khoản (có phân trang & filter)
   * GET /api/accounts?page=1&game=lien-quan&type=trang
   */
  getAll: async (params?: GetAccountsParams): Promise<AccountListResponse> => {
    const data = await api.get("/accounts", { params });
    return data.data;
  },

  /**
   * Lấy chi tiết 1 tài khoản theo ID
   * GET /api/accounts/:id
   */
  getById: async (id: string): Promise<Account> => {
    const data = await api.get(`/accounts/${id}`);
    return data.data;
  },
};
