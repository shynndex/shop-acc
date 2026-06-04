import { api } from "@/lib/clientAxios";

export const orderService = {
  purchaseAccount: async (
    accountId: string,
    discountCode?: string,
    paymentMethod: string = "balance",
  ) => {
    const payload: Record<string, any> = { paymentMethod };
    if (discountCode) payload.discountCode = discountCode;
    // api.post interceptor unwraps success.data — trả về { order, account, newBalance, ... } trực tiếp
    return await api.post(`/orders/${accountId}/purchase`, payload);
  },
  getUserOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    // api.get interceptor unwraps success.data — trả về { orders, totalPages, ... } trực tiếp
    return await api.get("/orders", { params });
  },
};
