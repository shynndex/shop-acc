// stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState } from "../types/client/store";
import { authService } from "../services/authService";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,
      isAuthenticated: false,

      checkAuth: async () => {
        const { accessToken } = get();

        if (!accessToken) {
          set({ loading: false, user: null, isAuthenticated: false });
          return;
        }

        set({ loading: true });

        // nếu có token thì gọi về backend để xác thực token
        try {
          const response = await authService.checkAuth();
          if (response?.success && response.user) {
            set({ user: response.user, isAuthenticated: true, loading: false });
          } else {
            set({
              loading: false,
              user: null,
              isAuthenticated: false,
              accessToken: null,
            });
          }
        } catch (error) {
          console.log("Có lỗi xảy ra ở checkAuth", error);
          set({
            loading: false,
            user: null,
            isAuthenticated: false,
            accessToken: null,
          });
        }
      },

      setAccessToken: (token) => set({ accessToken: token }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      signIn: async ({ email, password }) => {
        try {
          set({ loading: true });
          const response = await authService.signIn({ email, password });

          set({
            accessToken: response.accessToken,
            user: response.user,
            isAuthenticated: true,
            loading:false
          });

          return true;
        } catch (error: any) {
          const message =
            error?.response?.data?.message || "Đăng nhập thất bại";
          throw new Error(message);
        } finally {
          set({ loading: false });
        }
      },

      signUp: async ({ username, password, email, firstName, lastName }) => {
        try {
          set({ loading: true });
          await authService.signUp(
            username,
            password,
            email,
            firstName,
            lastName,
          );

          return true;
        } catch (error: any) {
          const message = error?.response?.data?.message || "Đăng ký thất bại";
          throw new Error(message);
        } finally {
          set({ loading: false });
        }
      },

      signOut: async () => {
        try {
          await authService.signOut();
        } catch (error) {
          console.error("[signOut] Error:", error);
        } finally {
          set({ accessToken: null, user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
