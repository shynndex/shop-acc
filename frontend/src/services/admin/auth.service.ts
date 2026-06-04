import { api } from "@/lib/adminAxios";
import type {
  DisableTwoFactorPayload,
  GetMeResponse,
  LoginPayload,
  LoginResponse,
  TwoFactorSetupResponse,
  TwoFactorStatus,
  VerifyTwoFactorLoginPayload,
  VerifyTwoFactorPayload,
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

  // ─── 2FA ──────────────────────────────────────────────────────────────
  getTwoFactorStatus: async (): Promise<TwoFactorStatus> => {
    const response = await api.get<TwoFactorStatus>("/auth/2fa/status");
    return response;
  },

  setupTwoFactor: async (): Promise<TwoFactorSetupResponse> => {
    const response = await api.post<TwoFactorSetupResponse>("/auth/2fa/setup");
    return response;
  },

  verifyTwoFactor: async (
    payload: VerifyTwoFactorPayload,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      "/auth/2fa/verify",
      payload,
    );
    return response;
  },

  disableTwoFactor: async (
    payload: DisableTwoFactorPayload,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      "/auth/2fa/disable",
      payload,
    );
    return response;
  },

  verifyTwoFactorLogin: async (
    payload: VerifyTwoFactorLoginPayload,
  ): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(
      "/auth/verify-2fa-login",
      payload,
    );
    return response;
  },
};
