import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountService } from "@/services/admin/account.service";
import { depositService } from "@/services/admin/deposit.service";
import { analyticsService } from "@/services/admin/analytics.service";
import { auditService } from "@/services/admin/audit.service";
import { orderService } from "@/services/admin/order.service";
import { paymentMonitorService } from "@/services/admin/paymentMonitor.service";
import { giftcodeService } from "@/services/admin/giftcode.service";
import { reviewService } from "@/services/admin/review.service";
import { reconciliationService } from "@/services/admin/reconciliation.service";
import { userBalanceService } from "@/services/admin/userBalance.service";

// ─── Query Keys ─────────────────────────────────────────────────────────
export const queryKeys = {
  accounts: {
    all: ["accounts"] as const,
    list: (params?: Record<string, any>) => ["accounts", "list", params] as const,
  },
  deposits: {
    all: ["deposits"] as const,
    list: (params?: Record<string, any>) => ["deposits", "list", params] as const,
  },
  analytics: {
    dashboard: ["analytics", "dashboard"] as const,
  },
  auditLogs: {
    all: ["auditLogs"] as const,
    list: (params?: Record<string, any>) => ["auditLogs", "list", params] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (params?: Record<string, any>) => ["orders", "list", params] as const,
    stats: ["orders", "stats"] as const,
  },
  paymentMonitor: {
    summary: ["paymentMonitor", "summary"] as const,
    webhookLogs: (params?: Record<string, any>) => ["paymentMonitor", "webhookLogs", params] as const,
    recent: ["paymentMonitor", "recent"] as const,
    stats: ["paymentMonitor", "stats"] as const,
  },
  giftcodes: {
    all: ["giftcodes"] as const,
    list: (params?: Record<string, any>) => ["giftcodes", "list", params] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    list: (params?: Record<string, any>) => ["reviews", "list", params] as const,
    stats: ["reviews", "stats"] as const,
  },
  reconciliation: {
    summary: ["reconciliation", "summary"] as const,
    alerts: ["reconciliation", "alerts"] as const,
    deposits: (params?: Record<string, any>) => ["reconciliation", "deposits", params] as const,
  },
  userBalance: {
    search: (q: string) => ["userBalance", "search", q] as const,
    log: (userId: string, params?: Record<string, any>) => ["userBalance", "log", userId, params] as const,
  },
};

// ─── Accounts ───────────────────────────────────────────────────────────
export function useAccountsQuery(params?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.accounts.list(params),
    queryFn: () => accountService.list(params),
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => accountService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts.all }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      accountService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts.all }),
  });
}

export function useToggleAccountStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      accountService.toggleStatus(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts.all }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts.all }),
  });
}

// ─── Deposits ───────────────────────────────────────────────────────────
export function useDepositsQuery(params?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.deposits.list(params),
    queryFn: () => depositService.list(params),
  });
}

export function useUpdateDepositStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      depositService.updateStatus(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.deposits.all }),
  });
}

// ─── Analytics ──────────────────────────────────────────────────────────
export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard,
    queryFn: () => analyticsService.getDashboard(),
  });
}

// ─── Audit Logs ─────────────────────────────────────────────────────────
export function useAuditLogsQuery(params?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(params),
    queryFn: () => auditService.list(params),
  });
}

// ─── Orders ─────────────────────────────────────────────────────────────
export function useOrdersQuery(params?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => orderService.list(params),
  });
}

export function useOrderStatsQuery() {
  return useQuery({
    queryKey: queryKeys.orders.stats,
    queryFn: () => orderService.getStats(),
  });
}

// ─── Payment Monitor ────────────────────────────────────────────────────
export function usePaymentSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.paymentMonitor.summary,
    queryFn: () => paymentMonitorService.getSummary(),
  });
}

export function usePaymentWebhookLogsQuery(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.paymentMonitor.webhookLogs(params),
    queryFn: () => paymentMonitorService.getWebhookLogs(params),
  });
}

export function usePaymentRecentQuery() {
  return useQuery({
    queryKey: queryKeys.paymentMonitor.recent,
    queryFn: () => paymentMonitorService.getRecentTransactions(),
  });
}

export function usePaymentStatsQuery() {
  return useQuery({
    queryKey: queryKeys.paymentMonitor.stats,
    queryFn: () => paymentMonitorService.getStats(),
  });
}

// ─── Giftcodes ──────────────────────────────────────────────────────────
export function useGiftcodesQuery(params?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.giftcodes.list(params),
    queryFn: () => giftcodeService.list(params),
  });
}

export function useCreateGiftcode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => giftcodeService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.giftcodes.all }),
  });
}

export function useToggleGiftcodeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      giftcodeService.toggleStatus(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.giftcodes.all }),
  });
}

export function useDeleteGiftcode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => giftcodeService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.giftcodes.all }),
  });
}

// ─── Reviews ────────────────────────────────────────────────────────────
export function useReviewsQuery(params?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.reviews.list(params),
    queryFn: () => reviewService.list(params),
  });
}

export function useReviewStatsQuery() {
  return useQuery({
    queryKey: queryKeys.reviews.stats,
    queryFn: () => reviewService.getStats(),
  });
}

export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: "approved" | "rejected"; reason?: string }) =>
      reviewService.moderate(id, { status, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.reviews.all }),
  });
}

// ─── Reconciliation ─────────────────────────────────────────────────────
export function useReconSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.reconciliation.summary,
    queryFn: () => reconciliationService.summary(),
  });
}

export function useReconAlertsQuery() {
  return useQuery({
    queryKey: queryKeys.reconciliation.alerts,
    queryFn: () => reconciliationService.alerts(),
    refetchInterval: 60_000, // Auto-refresh mỗi 60s
  });
}

export function useReconDepositsQuery(params?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.reconciliation.deposits(params),
    queryFn: () => reconciliationService.deposits(params),
  });
}

// ─── User Balance ───────────────────────────────────────────────────────
export function useSearchUserQuery(query: string) {
  return useQuery({
    queryKey: queryKeys.userBalance.search(query),
    queryFn: () => userBalanceService.search(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

export function useBalanceLogQuery(userId: string | null, params?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.userBalance.log(userId!, params),
    queryFn: () => userBalanceService.getBalanceLog(userId!, params),
    enabled: !!userId,
  });
}

export function useAdjustBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: any }) =>
      userBalanceService.adjustBalance(userId, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.userBalance.log(variables.userId) });
    },
  });
}
