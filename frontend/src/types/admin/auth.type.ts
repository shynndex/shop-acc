import type { AdminUser } from "@/types/index";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginSuccess {
  success: true;
  admin: AdminUser;
  requiresTwoFactor?: false;
  message?: string;
}

export interface LoginRequiresTwoFactor {
  success: true;
  requiresTwoFactor: true;
  tempToken: string;
  message: string;
}

export type LoginResponse = LoginSuccess | LoginRequiresTwoFactor;

export type GetMeResponse = AdminUser | null;

export interface TwoFactorStatus {
  success: boolean;
  totpEnabled: boolean;
  totpVerifiedAt: string | null;
}

export interface TwoFactorSetupResponse {
  success: boolean;
  secret: string;
  qrCode: string;
  message: string;
}

export interface VerifyTwoFactorPayload {
  totpCode: string;
}

export interface DisableTwoFactorPayload {
  password: string;
  totpCode: string;
}

export interface VerifyTwoFactorLoginPayload {
  tempToken: string;
  totpCode: string;
}

export interface UploadResponse {
  success: boolean;
  url: string;
  message?: string;
}
