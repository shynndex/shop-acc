import type { AdminUser } from "..";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  admin: AdminUser;
  message?: string;
}



export interface GetMeResponse {
  success: boolean;
  admin: AdminUser;
  message?: string;
}

