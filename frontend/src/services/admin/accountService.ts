import { adminApi, api } from "@/lib/adminAxios";
import type {
  Account,
  AccountListResponse,
  CreateAccountPayload,
  UpdateAccountPayload,
} from "@/types/admin/account";

export const accountService = {
  //list account
  list: async (params?: {
    game?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get<AccountListResponse>("/accounts", {
      params,
    });
    return response.data;
  },

  // get by id
  getById: async (id: string) => {
    const response = await adminApi.get<{ success: boolean; data: { account: Account } }>(
      `/admin/accounts/${id}`,
    );
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
    const response = await adminApi.put<{ success: boolean; data: { account: Account } }>(
      `/admin/accounts/${id}`,
      payload,
    );
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
