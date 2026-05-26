import { api } from "@/lib/adminAxios";
import type { Giftcode, GiftcodeListResponse, CreateGiftcodePayload, UpdateGiftcodePayload } from "@/types/admin/giftcode.type";

export const giftcodeService = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const data = await api.get<GiftcodeListResponse>("/admin/giftcodes", { params });
    return data;
  },

  create: async (payload: CreateGiftcodePayload) => {
    const data = await api.post<{ giftcode: Giftcode }>("/admin/giftcodes", payload);
    return data.giftcode;
  },

  update: async (id: string, payload: UpdateGiftcodePayload) => {
    const data = await api.put<{ giftcode: Giftcode }>(`/admin/giftcodes/${id}`, payload);
    return data.giftcode;
  },

  delete: async (id: string) => {
    const data = await api.delete<{ message: string }>(`/admin/giftcodes/${id}`);
    return data;
  },
};