import { api } from "@/lib/clientAxios";
import type { Review } from "@/types";

export interface CreateReviewPayload {
  accountId: string;
  orderId: string;
  rating: number;
  comment?: string;
}

export interface ReviewListResponse {
  reviews: Review[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export const reviewService = {
  /**
   * Tạo đánh giá mới (cần đăng nhập + đã mua)
   */
  create: async (payload: CreateReviewPayload): Promise<{ review: Review }> => {
    return await api.post("/reviews", payload);
  },

  /**
   * Sửa đánh giá (trong 24h)
   */
  update: async (
    id: string,
    payload: { rating?: number; comment?: string },
  ): Promise<{ review: Review }> => {
    return await api.put(`/reviews/${id}`, payload);
  },

  /**
   * Lấy danh sách review public cho 1 sản phẩm
   */
  getPublic: async (params: {
    accountId: string;
    page?: number;
    limit?: number;
  }): Promise<ReviewListResponse> => {
    const data = await api.get<ReviewListResponse>("/reviews", { params });
    return data;
  },

  /**
   * Lấy review của user hiện tại cho 1 tài khoản
   */
  getMyReview: async (accountId: string): Promise<{ review: Review | null }> => {
    return await api.get("/reviews/my-review", {
      params: { accountId },
    });
  },
};
