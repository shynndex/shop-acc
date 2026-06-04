import { api } from "@/lib/adminAxios";
import type {
  Order,
  OrderListResponse,
  OrderStats,
} from "@/types/admin/order.type";

export const orderService = {
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentMethod?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const result = await api.get<OrderListResponse>("/orders", {
      params,
    });
    return result;
  },

  getById: async (id: string) => {
    const result = await api.get<{ order: Order }>(`/orders/${id}`);
    return result.order;
  },

  getStats: async () => {
    const result = await api.get<OrderStats>("/orders/stats");
    return result;
  },

  exportCsv: async (filters?: Record<string, any>) => {
    const blob = await api.get<Blob>("/orders/export", {
      params: filters,
      responseType: "blob",
    });
    return blob;
  },
};
