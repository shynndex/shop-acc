import { api } from "@/lib/clientAxios";
import type { Account } from "@/types";
import type {
  AccountListResponse,
  GetAccountsParams,
  FilterOptions,
} from "@/types/client/services";

export const accountService = {
  /**
   * Lấy danh sách tài khoản (có phân trang & filter)
   * GET /api/accounts?page=1&game=lien-quan&type=trang&rank=Kim%20C%C6%B0%C6%A1ng&minSkins=10
   */
  getAll: async (params?: GetAccountsParams): Promise<AccountListResponse> => {
    return await api.get<AccountListResponse>("/accounts", { params });
  },

  /**
   * So sánh nhiều tài khoản
   * POST /api/accounts/compare
   */
  compare: async (ids: string[]): Promise<{ accounts: Account[] }> => {
    return await api.post<{ accounts: Account[] }>("/accounts/compare", { ids });
  },

  /**
   * Lấy chi tiết 1 tài khoản theo ID
   * GET /api/accounts/:id
   */
  getById: async (id: string): Promise<Account> => {
    const data = await api.get<Account>(`/accounts/${id}`);
    return data;
  },

  /**
   * Lấy các giá trị filter khả dụng cho 1 game
   * GET /api/accounts/filters?game=lien-quan
   */
  getFilterOptions: async (game?: string): Promise<FilterOptions> => {
    const data = await api.get<FilterOptions>("/accounts/filters", {
      params: game ? { game } : undefined,
    });
    return data;
  },

  /**
   * Lấy gợi ý sản phẩm
   * GET /api/accounts/suggestions?accountId=...&type=related|popular
   */
  getSuggestions: async (params: {
    accountId?: string;
    type?: "related" | "popular";
    limit?: number;
  }): Promise<Account[]> => {
    const data = await api.get<{ accounts: Account[] }>("/accounts/suggestions", {
      params,
    });
    return data.accounts || data;
  },
};
