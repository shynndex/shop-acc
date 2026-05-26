// ── KPI ──────────────────────────────────────────────────────────
export interface ReconKpi {
  label: string;
  value: number;
  suffix: string; // "đ" | "%"
  trend?: "up" | "down";
  change?: number;
  type?: "warning" | "success";
}

export interface DepositMethodSummary {
  method: "bank" | "card";
  label: string;
  todayCount: number;
  todayAmount: number;
  monthAmount: number;
}

export interface ReconRecentTransaction {
  id: string;
  type: "bank" | "card";
  user: string;
  amount: number;
  referenceCode?: string;
  provider?: string;
  createdAt: string;
}

// ── Summary Response ─────────────────────────────────────────────
export interface ReconSummaryResponse {
  success: boolean;
  data: {
    kpis: {
      totalDepositsToday: ReconKpi;
      totalDepositsMonth: ReconKpi;
      successRateToday: ReconKpi;
      totalRevenueToday: ReconKpi;
      totalRevenueMonth: ReconKpi;
      pendingAlertCount: ReconKpi;
    };
    depositMethods: DepositMethodSummary[];
    recentTransactions: ReconRecentTransaction[];
  };
}

// ── Alert ────────────────────────────────────────────────────────
export type AlertSeverity = "critical" | "warning" | "info";

export interface ReconAlert {
  type: "stale_bank_deposit" | "stale_card_deposit" | "amount_mismatch";
  severity: AlertSeverity;
  depositId: string;
  user: string;
  message: string;
  createdAt: string;
  ageMinutes: number;
  // Type-specific
  expectedAmount?: number;
  referenceCode?: string;
  declaredValue?: number;
  receivedAmount?: number;
  provider?: string;
  serial?: string;
}

export interface ReconAlertsResponse {
  success: boolean;
  data: {
    total: number;
    critical: number;
    warning: number;
    alerts: ReconAlert[];
  };
}

// ── Deposit List Item (combined bank + card) ────────────────────
export interface ReconDeposit {
  _id: string;
  type: "bank" | "card";
  status: string;
  amount: number;
  referenceCode?: string;
  user: {
    _id: string;
    username: string;
    email?: string;
  };
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  provider?: string;
  serial?: string;
  declaredValue?: number;
  receivedAmount?: number;
  transactionData?: any;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReconDepositsResponse {
  success: boolean;
  data: {
    deposits: ReconDeposit[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

// ── Store State ─────────────────────────────────────────────────
export interface ReconciliationState {
  // Summary
  kpis: ReconSummaryResponse["data"]["kpis"] | null;
  depositMethods: DepositMethodSummary[];
  recentTransactions: ReconRecentTransaction[];
  // Alerts
  alerts: ReconAlert[];
  alertCounts: { total: number; critical: number; warning: number };
  // Deposits list
  deposits: ReconDeposit[];
  pagination: { currentPage: number; totalPages: number; totalItems: number };

  loading: boolean;
  error: string | null;

  fetchSummary: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchDeposits: (params?: Record<string, any>) => Promise<void>;
}
