import type { AdminUser } from "..";
import type { GetMeResponse, LoginResponse} from "./services";

export interface AuthState {
  admin: AdminUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<GetMeResponse | null>;
  clearError: () => void;
  updateAdmin: (data: Partial<AdminUser>) => void;
}
  