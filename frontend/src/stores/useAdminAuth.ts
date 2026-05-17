import { authService } from "@/services/admin/auth.service";
import type { AdminUser } from "@/types";
import type { AuthState } from "@/types/admin/store.type";
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

          set({
            admin: response.admin,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
          return response.admin;
        } catch (error: any) {
           const message = error?.message || "Đăng nhập thất bại";
          set({ loading: false, error: message, isAuthenticated: false });
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
          const admin = await authService.getMe();

          if (admin) {
            set({
              admin: admin,
              isAuthenticated: true,
              error: null,
              loading: false,
            });
            return admin;
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
