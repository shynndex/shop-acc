// stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import type { AuthState } from "../types/store";
import { authService } from "../services/authService";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      loading: false,

      setAccessToken: (token) => set({ accessToken: token }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      signIn: async ({ username, password }) => {
        try {
          set({ loading: true });
          const response = await authService.signIn({ username, password });

          set({
            accessToken: response.accessToken,
            user: response.user,
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
          set({ accessToken: null, user: null });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);
