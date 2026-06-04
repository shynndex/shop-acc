export interface PaymentSummary {
  today: {
    totalCount: number;
    totalAmount: number;
    successCount: number;
    successRate: number;
    pendingCount: number;
    webhookCount: number;
    breakdown: {
      bank: { count: number; amount: number; pending: number };
      card: { count: number; amount: number; pending: number };
    };
  };
  month: {
    totalAmount: number;
    totalCount: number;
  };
}

export interface WebhookLog {
  id: string;
  type: "payos" | "payos_purchase" | "card";
  provider: string;
  amount: number;
  status: string;
  user?: { _id: string; username?: string; displayName?: string };
  webhookReceivedAt: string;
  createdAt: string;
  referenceCode?: string;
  orderCode?: number;
  payosOrderId?: string;
  declaredValue?: number;
  apiTransId?: number;
  apiStatusCode?: number;
  isAmountMismatch?: boolean;
  serial?: string;
  hasTransactionData?: boolean;
}

export interface WebhookLogsResponse {
  webhooks: WebhookLog[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export interface RecentTransaction {
  id: string;
  type: "bank" | "card" | "purchase";
  method: string;
  amount: number;
  status: string;
  referenceCode: string;
  user?: { _id: string; username?: string; displayName?: string; email?: string };
  createdAt: string;
  updatedAt: string;
  expectedAmount?: number;
  declaredValue?: number;
  isAmountMismatch?: boolean;
  discount?: { code: string; type: string; value: number; amount: number } | null;
}

export interface RecentTransactionsResponse {
  transactions: RecentTransaction[];
  total: number;
}

export interface PaymentStats {
  statusDistribution: Record<string, number>;
  methodBreakdown: {
    bank: { count: number; totalAmount: number; avgAmount: number };
    card: { count: number; totalAmount: number; avgAmount: number };
  };
  providerBreakdown: { _id: string; count: number; totalAmount: number }[];
  dailyVolume: {
    date: string;
    bankCount: number;
    bankAmount: number;
    cardCount: number;
    cardAmount: number;
  }[];
}
