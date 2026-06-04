import { api } from "@/lib/adminAxios";
import type { Review } from "@/types";

export const reviewService = {
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const data = await api.get<{
      reviews: Review[];
      totalPages: number;
      currentPage: number;
      totalItems: number;
    }>("/reviews", { params });
    return data;
  },

  getStats: async () => {
    const data = await api.get<{
      pending: number;
      approved: number;
      rejected: number;
      total: number;
    }>("/reviews/stats");
    return data;
  },

  moderate: async (id: string, payload: { status: "approved" | "rejected"; reason?: string }) => {
    const data = await api.patch<{ review: Review }>(`/reviews/${id}/status`, payload);
    return data.review;
  },
};
