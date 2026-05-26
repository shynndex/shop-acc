// ── Balance Log Entry ───────────────────────────────────────────
export interface BalanceLogEntry {
  timestamp: string;
  userId: string;
  userName?: string;
  type: "credit" | "debit" | "admin_adjust";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  note?: string;
  ip?: string;
}

// ── Balance Log Response ────────────────────────────────────────
export interface BalanceLogResponse {
  success: boolean;
  data: {
    user: {
      _id: string;
      username: string;
      email: string;
      displayName?: string;
      currentBalance: number;
    } | null;
    entries: BalanceLogEntry[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

// ── Adjust Balance Request ──────────────────────────────────────
export interface AdjustBalancePayload {
  amount: number; // positive = credit, negative = debit
  reason: string;
}

// ── Adjust Balance Response ─────────────────────────────────────
export interface AdjustBalanceResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    username: string;
    previousBalance: number;
    newBalance: number;
    adjustment: number;
    reason: string;
  };
}

// ── Search User Response ────────────────────────────────────────
export interface SearchUserItem {
  _id: string;
  username: string;
  email: string;
  displayName?: string;
}

export interface SearchUserResponse {
  success: boolean;
  data: SearchUserItem[];
}

// ── Store State ─────────────────────────────────────────────────
export interface UserBalanceState {
  // Current user being viewed
  userId: string | null;
  userInfo: {
    _id: string;
    username: string;
    email: string;
    displayName?: string;
    currentBalance: number;
  } | null;

  // Balance log
  entries: BalanceLogEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };

  // Adjust balance
  adjusting: boolean;
  adjustResult: {
    newBalance: number;
    adjustment: number;
    reason: string;
    previousBalance: number;
    username: string;
  } | null;
  adjustMessage: string | null;

  // Search user
  searchResults: SearchUserItem[];
  searchingUser: boolean;
  searchQuery: string;

  // UI state
  loading: boolean;
  error: string | null;

  // Actions
  searchUser: (query: string) => Promise<void>;
  selectUser: (userId: string) => void;
  fetchBalanceLog: (userId: string, params?: { page?: number; limit?: number; dateFrom?: string; dateTo?: string }) => Promise<void>;
  adjustBalance: (userId: string, payload: AdjustBalancePayload) => Promise<boolean>;
  clearSearch: () => void;
  clearAdjustResult: () => void;
  clearUser: () => void;
}
