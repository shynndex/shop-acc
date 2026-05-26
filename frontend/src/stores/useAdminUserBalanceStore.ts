import { userBalanceService } from "@/services/admin/userBalance.service";
import type {
  UserBalanceState,
  AdjustBalancePayload,
} from "@/types/admin/userBalance.type";
import { create } from "zustand";

export const useAdminUserBalanceStore = create<UserBalanceState>((set, get) => ({
  userId: null,
  userInfo: null,
  entries: [],
  pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
  adjusting: false,
  adjustResult: null,
  adjustMessage: null,
  searchResults: [],
  searchingUser: false,
  searchQuery: "",
  loading: false,
  error: null,

  searchUser: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [], searchQuery: "" });
      return;
    }
    set({ searchingUser: true, error: null, searchQuery: query });
    try {
      const data = await userBalanceService.search(query);
      set({
        searchResults: data || [],
        searchingUser: false,
      });
    } catch (err: any) {
      set({
        error: err?.message || "Không thể tìm kiếm người dùng",
        searchingUser: false,
      });
    }
  },

  selectUser: (userId: string) => {
    set({ userId, adjustResult: null, adjustMessage: null, error: null });
  },

  fetchBalanceLog: async (userId, params) => {
    set({ loading: true, error: null, userId });
    try {
      const data = await userBalanceService.getBalanceLog(userId, params);
      set({
        userInfo: data?.user || null,
        entries: data?.entries || [],
        pagination: {
          currentPage: data?.currentPage || 1,
          totalPages: data?.totalPages || 1,
          totalItems: data?.totalItems || 0,
        },
        loading: false,
      });
    } catch (err: any) {
      set({
        error:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tải lịch sử số dư",
        loading: false,
      });
    }
  },

  adjustBalance: async (userId: string, payload: AdjustBalancePayload) => {
    set({ adjusting: true, error: null, adjustResult: null });
    try {
      const data = await userBalanceService.adjustBalance(userId, payload);
      set({
        adjustResult: {
          newBalance: data?.newBalance || 0,
          adjustment: data?.adjustment || 0,
          reason: data?.reason || "",
          previousBalance: data?.previousBalance || 0,
          username: data?.username || "",
        },
        adjustMessage: `Đã điều chỉnh số dư ${(data?.adjustment || 0) > 0 ? "+" : ""}${(data?.adjustment || 0).toLocaleString("vi-VN")}đ`,
        currentBalance: data?.newBalance || 0,
        userInfo: get().userInfo
          ? {
              ...get().userInfo!,
              currentBalance: data?.newBalance || 0,
            }
          : null,
        adjusting: false,
      });
      // Refresh balance log after adjustment
      const state = get();
      if (state.userId) {
        await state.fetchBalanceLog(state.userId, {
          page: 1,
          limit: 20,
        });
      }
      return true;
    } catch (err: any) {
      set({
        error:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể điều chỉnh số dư",
        adjusting: false,
      });
      return false;
    }
  },

  clearSearch: () => set({ searchResults: [], searchQuery: "" }),
  clearAdjustResult: () => set({ adjustResult: null, adjustMessage: null }),
  clearUser: () =>
    set({
      userId: null,
      userInfo: null,
      entries: [],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
      adjustResult: null,
      adjustMessage: null,
      error: null,
    }),
}));
