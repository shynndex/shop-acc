import { api } from "@/lib/clientAxios";

export const orderService = {
  purchaseAccount: async (
    accountId: string,
    discountCode?: string,
    paymentMethod: string = "balance",
  ) => {
    const payload: Record<string, any> = { paymentMethod };
    if (discountCode) payload.discountCode = discountCode;
    const { data } = await api.post(`/orders/${accountId}/purchase`, payload);
    return data;
  },
  getUserOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const { data } = await api.get("/orders", { params });
    return data;
  },
};
