import { api } from "@/lib/axios";
import type { AuthResponse, SignInPayload } from "@/types/client/services";

export const authService = {
  signIn: async (payload: SignInPayload): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/sign-in", payload);
    return response;
  },

  signUp: async (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>("/auth/sign-up", {
      username,
      password,
      email,
      firstName,
      lastName,
    });
    return response;
  },

  signOut: async (): Promise<void> => {
    await api.post("/auth/sign-out");
  },

  verifyEmail: async (token: string) => {
    const response = await api.post<{ message: string }>("/auth/verify-email", {
      token,
    });
    return response;
  },
  resendVerify: async (email: string) => {
    const response = await api.post<{ message: string }>(
      "/auth/resend-verify",
      {
        email,
      },
    );
    return response;
  },
};
