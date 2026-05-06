import type { AdminUser } from "@/types/index";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  admin: AdminUser;
  message?: string;
}

export type GetMeResponse = AdminUser | null;
