import { create } from "zustand";
import { toast } from "sonner";
import type { AuthState } from "../types/store";
import { authService } from "../services/authService";
export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,
  signUp: async ({ username, password, email, firstName, lastName }) => {
    try {
      set({ loading: true });
      const response = await authService.signUp(
        username,
        password,
        email,
        firstName,
        lastName,
      );

      if (response?.accessToken && response?.user) {
        set({ accessToken: response.accessToken, user: response.user });
        toast.success("Đăng kí thành công");
        return true;
      }
      return false;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error.message ||
        "Đăng ký thất bại. Vui lòng thử lại.";

      toast.error(errorMessage);
      console.error("[AuthStore] signUp error:", error);
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
