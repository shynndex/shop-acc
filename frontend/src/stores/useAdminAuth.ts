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

      // ─── 2FA state ─────────────────────────────────────────────────────
      requiresTwoFactor: false,
      tempToken: null,
      loginEmail: "",

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const response = await authService.login(credentials);

          if ("requiresTwoFactor" in response && response.requiresTwoFactor) {
            // 2FA required — store tempToken, don't authenticate yet
            set({
              requiresTwoFactor: true,
              tempToken: response.tempToken,
              loginEmail: credentials.email,
              loading: false,
              error: null,
              isAuthenticated: false,
            });
            return response;
          }

          // Normal login success
          set({
            admin: response.admin,
            isAuthenticated: true,
            loading: false,
            error: null,
            requiresTwoFactor: false,
            tempToken: null,
          });
          return response.admin;
        } catch (error: any) {
          const message = error?.message || "Đăng nhập thất bại";
          set({
            loading: false,
            error: message,
            isAuthenticated: false,
            requiresTwoFactor: false,
            tempToken: null,
          });
          throw error;
        }
      },

      verifyTwoFactorLogin: async (totpCode: string) => {
        const { tempToken } = get();
        if (!tempToken) throw new Error("Không có mã xác thực tạm thời");

        set({ loading: true, error: null });
        try {
          const response = await authService.verifyTwoFactorLogin({
            tempToken,
            totpCode,
          });

          if ("admin" in response && response.admin) {
            set({
              admin: response.admin,
              isAuthenticated: true,
              loading: false,
              error: null,
              requiresTwoFactor: false,
              tempToken: null,
              loginEmail: "",
            });
            return response.admin;
          }

          throw new Error("Xác thực 2FA thất bại");
        } catch (error: any) {
          const message = error?.message || "Mã xác thực không đúng";
          set({ loading: false, error: message });
          throw error;
        }
      },

      cancelTwoFactorLogin: () => {
        set({
          requiresTwoFactor: false,
          tempToken: null,
          loginEmail: "",
          loading: false,
          error: null,
        });
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
            requiresTwoFactor: false,
            tempToken: null,
            loginEmail: "",
          });
        }
      },

      checkAuth: async () => {
        try {
          const response = await authService.getMe();

          if (response?.admin) {
            set({
              admin: response.admin,
              isAuthenticated: true,
              error: null,
              loading: false,
            });
            return response.admin;
          } else {
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
        loginEmail: state.loginEmail,
      }),
    },
  ),
);
