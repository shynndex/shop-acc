import type { AdminUser } from "@/types/index";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  admin: AdminUser;
  message?: string;
}

export type GetMeResponse = AdminUser | null;

export interface UploadResponse {
  success: boolean;
  url: string;
  message?: string;
}
