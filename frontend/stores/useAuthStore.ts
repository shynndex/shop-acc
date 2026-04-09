import { create } from "zustand";
import { toast } from "sonner";
import type { AuthState } from "../types/store";
import { authService } from "../services/authService";
export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,
  signUp: async (username, password, email, firstName, lastName) => {
    try {
      set({ loading: true });
      await authService.signUp(username, password, email, firstName, lastName);
      toast.success("Dang ki thanh cong");
    } catch (error) {
      console.error(error);
      toast.error("Dang ki that bai");
    } finally {
      set({ loading: false });
    }
  },
}));
