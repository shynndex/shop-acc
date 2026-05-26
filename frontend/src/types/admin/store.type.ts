import type { AdminUser } from "..";
import type { Account } from "./account.type";
import type {
  CreateAccountPayload,
  UpdateAccountPayload,
} from "./account.type";
import type {
  ActivityItem,
  AnalyticsFilters,
  DepositMethodData,
  GameDistribution,
  KpiMetric,
  RevenueDataPoint,
} from "./analytics.type";
import type { LoginPayload } from "./auth.type";
import type { Deposit, UpdateDepositStatusPayload } from "./deposit.type";

export interface AuthState {
  admin: AdminUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  login: (credentials: LoginPayload) => Promise<AdminUser>;
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
    game?: string | string[];
    type?: string | string[];
    status?: string | string[];
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

export interface AdminDepositState {
  deposits: Deposit[];
  pagination: { currentPage: number; totalPages: number; totalItems: number };
  loading: boolean;
  error: string | null;

  fetchList: (params?: Record<string, any>) => Promise<void>;
  updateStatus: (
    id: string,
    payload: UpdateDepositStatusPayload,
  ) => Promise<Deposit | null>;
  exportCsv: (filters?: Record<string, any>) => Promise<Blob | null>;
}

export interface AdminAnalyticsState {
  kpis: {
    totalRevenue: KpiMetric;
    totalOrders: KpiMetric;
    newUsers: KpiMetric;
    activeAccounts: KpiMetric;
  } | null;
  revenueTrend: RevenueDataPoint[];
  gameDistribution: GameDistribution[];
  depositMethods: DepositMethodData[];
  recentActivities: ActivityItem[];

  loading: boolean;
  error: string | null;
  dateRange: { from: string; to: string };

  fetchDashboard: (filter?: AnalyticsFilters) => Promise<void>;
  refreshRevenue: (filter?: AnalyticsFilters) => Promise<void>;
  setDateRange: (from: string, to: string) => void;
}
