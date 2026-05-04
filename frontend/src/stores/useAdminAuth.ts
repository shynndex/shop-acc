import { authService } from "@/services/admin/authService";
import type { AdminUser } from "@/types";
import type { AuthState } from "@/types/admin/store";
import { persist } from "zustand/middleware";
import { create } from "zustand/react";

export const useAdminAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      loading: false,
      error: null,
      isAuthenticated: false,

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const response = await authService.login(credentials);

          if (response.success) {
            set({
              admin: response.admin,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
          } else {
            set({
              loading: false,
              isAuthenticated: false,
              error: response.message,
            });
            throw new Error(response.message);
          }
          return response;
        } catch (error: any) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          await authService.logout();
        } catch (error) {
          console.error("Có lỗi xảy ra khi đăng xuất", error);
        } finally {
          set({
            admin: null,
            isAuthenticated: false,
            loading: false,
          });
        }
      },

      checkAuth: async () => {
        try {
          const response = await authService.getMe();

          if (response?.success && response.admin) {
            set({
              admin: response.admin,
              isAuthenticated: true,
              error: null,
              loading: false,
            });
            return response;
          } else {
            // Chưa login hoặc token hết hạn
            set({
              admin: null,
              isAuthenticated: false,
              loading: false,
            });
            return null;
          }
        } catch (error) {
          set({
            admin: null,
            isAuthenticated: false,
            loading: false,
          });
          return null;
        }
      },
      clearError() {
        set({ error: null });
      },

      // Cập nhật thông tin admin (optimistic update)
      updateAdmin: (data: Partial<AdminUser>) => {
        set((state) => ({
          admin: state.admin ? { ...state.admin, ...data } : null,
        }));
      },
    }),
    {
      name: "admin-auth-storage",
      partialize: (state) => ({
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
