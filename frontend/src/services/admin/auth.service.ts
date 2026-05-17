import { api } from "@/lib/adminAxios";
import type {
  GetMeResponse,
  LoginPayload,
  LoginResponse,
} from "@/types/admin/auth.type";

export const authService = {
  login: async (credentials: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", credentials);
    return response;
  },

  logout: async (): Promise<void> => {
    const response = await api.post<void>("/auth/logout");
    return response;
  },
  getMe: async (): Promise<GetMeResponse | null> => {
    try {
      const response = await api.get<GetMeResponse>("/auth/me");
      return response;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  },
};
