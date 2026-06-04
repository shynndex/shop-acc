import { api } from "@/lib/adminAxios";
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

    const data = await api.get<AccountListResponse["data"]>("/accounts", {
      params: {
        ...params,
        game: normalizeMulti(params?.game),
        type: normalizeMulti(params?.type),
        status: normalizeMulti(params?.status),
      },
    });
    return data;
  },

  // get by id
  getById: async (id: string) => {
    const result = await api.get<{ account: Account }>(
      `/accounts/${id}`,
    );
    return result.account;
  },

  // create
  create: async (payload: CreateAccountPayload) => {
    const result = await api.post<{ account: Account }>(
      "/accounts",
      payload,
    );
    return result.account;
  },

  // update
  update: async (id: string, payload: UpdateAccountPayload) => {
    const result = await api.put<{ account: Account }>(
      `/accounts/${id}`,
      payload,
    );
    return result.account;
  },

  //toggle status
  toggleStatus: async (id: string, isActive: boolean) => {
    const result = await api.patch<{ account: Account }>(
      `/accounts/${id}/status`,
      { isActive },
    );
    return result.account;
  },

  //delete
  delete: async (id: string) => {
    await api.delete(`/accounts/${id}`);
  },

  exportCsv: async (filters?: Record<string, any>) => {
    const blob = await api.get<Blob>("/accounts/export", {
      params: filters,
      responseType: "blob",
    });
    return blob;
  },

  /** Bulk delete — calls individual delete with Promise.all */
  bulkDelete: async (ids: string[]) => {
    await Promise.all(ids.map((id) => api.delete(`/accounts/${id}`)));
  },
};
