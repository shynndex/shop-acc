import type { AdminUser } from "..";
import type { Account } from "./account"
import type { CreateAccountPayload, UpdateAccountPayload } from "./account";
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

export interface AccountState {
  //data
  accounts: Account[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };

  loading: boolean;
  error: string | null;

  // Actions
  fetchList: (params?: {
    game?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;

  createAccount: (payload: CreateAccountPayload) => Promise<Account | null>;
  updateAccount: (
    id: string,
    payload: UpdateAccountPayload,
  ) => Promise<Account | null>;
  toggleStatus: (id: string, isActive: boolean) => Promise<Account | null>;
  deleteAccount: (id: string) => Promise<boolean>;

  // Utils
  clearError: () => void;
  setAccounts: (accounts: Account[]) => void;
}
