import { adminApi, api } from "@/lib/adminAxios";
import type {
  Account,
  AccountListResponse,
  CreateAccountPayload,
  UpdateAccountPayload,
} from "@/types/admin/account.type";

export const accountService = {
  //list account
  list: async (params?: {
    game?: string | string[];
    type?: string | string[];
    status?: string | string[];
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const normalizeMulti = (value?: string | string[]) => {
      if (!value) return undefined;
      if (Array.isArray(value)) {
        const items = value.map((v) => String(v).trim()).filter(Boolean);
        return items.length > 0 ? items.join(",") : undefined;
      }
      const item = String(value).trim();
      return item ? item : undefined;
    };

    const response = await api.get<AccountListResponse>("/accounts", {
      params: {
        ...params,
        game: normalizeMulti(params?.game),
        type: normalizeMulti(params?.type),
        status: normalizeMulti(params?.status),
      },
    });
    return response.data;
  },

  // get by id
  getById: async (id: string) => {
    const response = await adminApi.get<{
      success: boolean;
      data: { account: Account };
    }>(`/admin/accounts/${id}`);
    return response.data.data.account;
  },

  // create
  create: async (payload: CreateAccountPayload) => {
    const response = await adminApi.post<{
      success: boolean;
      data: { account: Account };
    }>(`/admin/accounts`, payload);
    return response.data.data.account;
  },

  // update
  update: async (id: string, payload: UpdateAccountPayload) => {
    const response = await adminApi.put<{
      success: boolean;
      data: { account: Account };
    }>(`/admin/accounts/${id}`, payload);
    return response.data.data.account;
  },

  //toggle status
  toggleStatus: async (id: string, isActive: boolean) => {
    const response = await adminApi.patch<{
      success: boolean;
      data: { account: Account };
    }>(`/admin/accounts/${id}/status`, { isActive });
    return response.data.data.account;
  },

  //delete
  delete: async (id: string) => {
    await adminApi.delete<{ success: boolean }>(`/admin/accounts/${id}`);
  },
};
