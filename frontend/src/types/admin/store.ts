import type { AdminUser } from "..";
import type { LoginRequest } from "./services";

export interface AuthState {
  admin: AdminUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  login: (credentials: LoginRequest) => Promise<AdminUser>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<AdminUser | null>;
  clearError: () => void;
  updateAdmin: (data: Partial<AdminUser>) => void;
}
