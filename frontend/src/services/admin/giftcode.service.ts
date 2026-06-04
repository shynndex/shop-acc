import { api } from "@/lib/adminAxios";
import type { Giftcode, CreateGiftcodePayload, UpdateGiftcodePayload } from "@/types/admin/giftcode.type";

export const giftcodeService = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const data = await api.get<{
      giftcodes: Giftcode[];
      totalPages: number;
      currentPage: number;
      totalItems: number;
    }>("/giftcodes", { params });
    return data;
  },

  create: async (payload: CreateGiftcodePayload) => {
    const data = await api.post<{ giftcode: Giftcode }>("/giftcodes", payload);
    return data.giftcode;
  },

  update: async (id: string, payload: UpdateGiftcodePayload) => {
    const data = await api.put<{ giftcode: Giftcode }>(`/giftcodes/${id}`, payload);
    return data.giftcode;
  },

  delete: async (id: string) => {
    const data = await api.delete<{ message: string }>(`/giftcodes/${id}`);
    return data;
  },

  toggleStatus: async (id: string, isActive: boolean) => {
    const data = await api.patch<{ giftcode: Giftcode }>(`/giftcodes/${id}/status`, { isActive });
    return data.giftcode;
  },
};