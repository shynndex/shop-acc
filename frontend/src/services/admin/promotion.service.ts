import { api } from "@/lib/adminAxios";

export interface Promotion {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  minDepositAmount: number;
  rewardType: "balance_bonus" | "random_spin";
  rewardAmount: number;
  rewardSpins: number;
  startDate: string;
  endDate: string;
  usedBy: string[];
  lastUpdatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionFormData {
  name: string;
  description: string;
  isActive: boolean;
  minDepositAmount: number;
  rewardType: "balance_bonus" | "random_spin";
  rewardAmount: number;
  rewardSpins: number;
  startDate: string;
  endDate: string;
}

export const promotionService = {
  getAll: async (): Promise<{ success: boolean; data: Promotion[] }> => {
    const response = await api.get("/promotions");
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: Promotion }> => {
    const response = await api.get(`/promotions/${id}`);
    return response.data;
  },

  create: async (data: PromotionFormData): Promise<{ success: boolean; data: Promotion }> => {
    const response = await api.post("/promotions", data);
    return response.data;
  },

  update: async (id: string, data: Partial<PromotionFormData>): Promise<{ success: boolean; data: Promotion }> => {
    const response = await api.put(`/promotions/${id}`, data);
    return response.data;
  },

  toggleActive: async (id: string): Promise<{ success: boolean; data: Promotion }> => {
    const response = await api.patch(`/promotions/${id}/toggle`);
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/promotions/${id}`);
    return response.data;
  },

  getStats: async (id: string): Promise<{ success: boolean; data: { totalUsers: number; isActive: boolean } }> => {
    const response = await api.get(`/promotions/${id}/stats`);
    return response.data;
  },
};
