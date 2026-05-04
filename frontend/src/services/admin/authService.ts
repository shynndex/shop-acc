import { api } from "@/lib/adminAxios";
import type {
  GetMeResponse,
  LoginRequest,
  LoginResponse,
} from "@/types/admin/services";

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
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
