import { useCallback, useEffect, useState } from "react";

import { PageHeader, SearchBar, DataTable } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState, Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import {
  useSearchUserQuery,
  useBalanceLogQuery,
  useAdjustBalance,
} from "@/hooks/queries/useAdminQueries";
import { exportTableToCsv } from "@/hooks/useExportCsv";
import { cn, formatVND, formatDate } from "@/lib/utils";
import type { BalanceLogEntry, SearchUserItem } from "@/types/admin/userBalance.type";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Search,
  User,
  Wallet,
  RefreshCw,
  AlertCircle,
  Plus,
  Minus,
  History,
  CheckCircle,
  X,
  Loader2,
  Users,
  Download,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queries/useAdminQueries";

// ── CSV columns ─────────────────────────────────────────────────
const CSV_COLUMNS = [
  { key: "timestamp", label: "Thời gian" },
  { key: "type", label: "Loại" },
  { key: "amount", label: "Số tiền" },
  { key: "balanceBefore", label: "Số dư trước" },
  { key: "balanceAfter", label: "Số dư sau" },
  { key: "note", label: "Ghi chú" },
];

// ── Type Badges ─────────────────────────────────────────────────
const typeColors: Record<string, string> = {
  credit: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
  debit: "bg-red-500/10 text-red-600 border-red-200",
  admin_adjust: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
};

const typeLabels: Record<string, string> = {
  credit: "Nạp tiền",
  debit: "Chi tiêu",
  admin_adjust: "Admin điều chỉnh",
};

// ── Columns ─────────────────────────────────────────────────────
const columns: ColumnDef<BalanceLogEntry>[] = [
  {
    id: "timestamp",
    header: "Thời gian",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(row.original.timestamp)}
      </span>
    ),
  },
  {
    id: "type",
    header: "Loại",
    cell: ({ row }) => {
      const type = row.original.type || "admin_adjust";
      return (
        <Badge variant="outline" className={cn("font-medium", typeColors[type] || "")}>
          {typeLabels[type] || type}
        </Badge>
      );
    },
  },
  {
    id: "amount",
    header: "Số tiền",
    cell: ({ row }) => {
      const amount = row.original.amount || 0;
      const isCredit = amount > 0 || row.original.type === "credit";
      return (
        <div className={cn("font-semibold text-right", isCredit ? "text-green-600" : "text-red-600")}>
          {isCredit ? "+" : ""}
          {formatVND(Math.abs(amount))}đ
        </div>
      );
    },
  },
  {
    id: "balanceChange",
    header: "Trước → Sau",
    cell: ({ row }) => {
      const before = row.original.balanceBefore ?? 0;
      const after = row.original.balanceAfter ?? 0;
      return (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatVND(before)}đ → {formatVND(after)}đ
        </span>
      );
    },
  },
  {
    id: "note",
    header: "Ghi chú",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
        {row.original.note || row.original.reference || "—"}
      </span>
    ),
  },
];

// ── Adjust Balance Dialog ───────────────────────────────────────
function AdjustBalanceDialog({
  open,
  onOpenChange,
  userId,
  username,
  currentBalance,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
  currentBalance: number;
}) {
  const qc = useQueryClient();
  const { mutateAsync: adjustBalance, isPending: adjusting } = useAdjustBalance();

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isCredit, setIsCredit] = useState(true);
  const [success, setSuccess] = useState<{
    previousBalance: number;
    adjustment: number;
    newBalance: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setAmount("");
      setReason("");
      setIsCredit(true);
      setSuccess(null);
      setError(null);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!userId) return;
    const parsedAmount = parseInt(amount.replace(/\D/g, ""), 10);
    if (!parsedAmount || parsedAmount <= 0) return;
    const finalAmount = isCredit ? parsedAmount : -parsedAmount;

    try {
      const data = await adjustBalance({
        userId,
        payload: { amount: finalAmount, reason: reason.trim() },
      });
      setSuccess({
        previousBalance: data?.previousBalance || 0,
        adjustment: data?.adjustment || 0,
        newBalance: data?.newBalance || 0,
      });
      // Invalidate log query so it refreshes
      qc.invalidateQueries({ queryKey: queryKeys.userBalance.log(userId) });
      // Close after brief delay to show success
      setTimeout(() => onOpenChange(false), 2000);
    } catch (err: any) {
      setError(err?.message || "Không thể điều chỉnh số dư");
    }
  }, [userId, amount, isCredit, reason, adjustBalance, onOpenChange, qc]);

  const parsedAmount = parseInt(amount.replace(/\D/g, ""), 10);
  const isValid = parsedAmount > 0 && reason.trim().length >= 5;
  const newBalance = isCredit
    ? currentBalance + (parsedAmount || 0)
    : currentBalance - (parsedAmount || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Điều chỉnh số dư</DialogTitle>
          <DialogDescription>
            Đang điều chỉnh số dư của <strong>{username}</strong>. Số dư hiện tại:{" "}
            <strong>{formatVND(currentBalance)}đ</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Success state */}
        {success ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle className="size-12 text-green-500 mx-auto" />
            <p className="font-semibold text-green-600">Đã điều chỉnh số dư thành công</p>
            <div className="text-sm text-muted-foreground">
              <div>
                Số dư cũ: <strong>{formatVND(success.previousBalance)}đ</strong>
              </div>
              <div>
                Điều chỉnh:{" "}
                <strong className={success.adjustment > 0 ? "text-green-600" : "text-red-600"}>
                  {success.adjustment > 0 ? "+" : ""}
                  {formatVND(success.adjustment)}đ
                </strong>
              </div>
              <div>
                Số dư mới: <strong>{formatVND(success.newBalance)}đ</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Amount type toggle */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant={isCredit ? "default" : "outline"}
                className={cn(
                  "flex-1",
                  isCredit && "bg-green-600 hover:bg-green-700",
                )}
                onClick={() => setIsCredit(true)}
              >
                <Plus className="mr-1 size-4" /> Nạp tiền
              </Button>
              <Button
                type="button"
                variant={!isCredit ? "default" : "outline"}
                className={cn(
                  "flex-1",
                  !isCredit && "bg-red-600 hover:bg-red-700",
                )}
                onClick={() => setIsCredit(false)}
              >
                <Minus className="mr-1 size-4" /> Trừ tiền
              </Button>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Số tiền {isCredit ? "nạp" : "trừ"}
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^0-9]/g, ""))
                  }
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  đ
                </span>
              </div>
              {amount && parsedAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {isCredit ? "Nạp" : "Trừ"}{" "}
                  <strong>{formatVND(parsedAmount)}đ</strong>. Số dư mới:{" "}
                  <strong className={newBalance < 0 ? "text-red-500" : ""}>
                    {formatVND(newBalance)}đ
                  </strong>
                </p>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Lý do điều chỉnh</Label>
              <Textarea
                id="reason"
                placeholder="Nhập lý do điều chỉnh (tối thiểu 5 ký tự)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
              <p
                className={cn(
                  "text-xs",
                  reason.trim().length > 0 && reason.trim().length < 5
                    ? "text-red-500"
                    : "text-muted-foreground",
                )}
              >
                {reason.trim().length}/5 ký tự tối thiểu
              </p>
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {!success && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || adjusting}
                className={cn(isCredit ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700")}
              >
                {adjusting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  `Xác nhận ${isCredit ? "nạp" : "trừ"}`
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── User Search Results Dropdown ────────────────────────────────
function UserSearchResults({
  results,
  loading,
  onSelect,
}: {
  results: SearchUserItem[];
  loading: boolean;
  onSelect: (user: SearchUserItem) => void;
}) {
  if (loading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border bg-popover shadow-md overflow-hidden">
        <div className="p-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border bg-popover shadow-md overflow-hidden max-h-[280px] overflow-y-auto">
      <div className="p-1">
        {results.map((user) => (
          <button
            key={user._id}
            type="button"
            onClick={() => onSelect(user)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent text-left transition-colors"
          >
            <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">
                {user.displayName || user.username}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                @{user.username} — {user.email}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function UserBalancePage() {
  const qc = useQueryClient();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{
    username?: string;
    displayName?: string;
    email?: string;
    currentBalance: number;
  } | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // TanStack Query hooks
  const {
    data: searchResults,
    isFetching: searchingUser,
  } = useSearchUserQuery(debouncedSearch);

  const {
    data: balanceData,
    isLoading: loading,
    refetch: refetchLog,
  } = useBalanceLogQuery(selectedUserId, {
    page,
    limit: 20,
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  });

  // Update userInfo when balance data loads
  useEffect(() => {
    if (balanceData?.user) {
      setUserInfo(balanceData.user);
    }
  }, [balanceData]);

  const entries: BalanceLogEntry[] = balanceData?.entries || [];
  const pagination = {
    currentPage: balanceData?.currentPage || 1,
    totalPages: balanceData?.totalPages || 1,
    totalItems: balanceData?.totalItems || 0,
  };

  const handleSelectUser = useCallback(
    (user: SearchUserItem) => {
      setSelectedUserId(user._id);
      setUserInfo({
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        currentBalance: user.currentBalance || 0,
      });
      setShowSearchResults(false);
      setSearchInput(user.displayName || user.username);
      setPage(1);
    },
    [],
  );

  const handleRefresh = useCallback(() => {
    if (selectedUserId) {
      refetchLog();
      qc.invalidateQueries({ queryKey: queryKeys.userBalance.log(selectedUserId) });
    }
  }, [selectedUserId, refetchLog, qc]);

  const handlePageChange = useCallback(
    (newPage: number) => setPage(newPage),
    [],
  );

  const handleClearUser = useCallback(() => {
    setSelectedUserId(null);
    setUserInfo(null);
    setSearchInput("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }, []);

  const typeLabelsLookup: Record<string, string> = {
    credit: "Nạp tiền",
    debit: "Chi tiêu",
    admin_adjust: "Admin điều chỉnh",
  };

  // Close search results on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-search-container]")) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Show search results when debouncedSearch changes
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length >= 2) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [debouncedSearch]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Header */}
      <PageHeader
        title="Quản lý số dư người dùng"
        description="Tra cứu lịch sử biến động số dư và điều chỉnh số dư người dùng"
      />

      {/* User Search + Selected User Info */}
      <GlassCard>
        <CardContent className="pt-6">
          {!selectedUserId ? (
            /* Search mode */
            <div className="space-y-2">
              <Label className="text-base font-medium">
                <Search className="size-4 inline mr-2" />
                Tìm kiếm người dùng
              </Label>
              <div className="relative" data-search-container>
                <SearchBar
                  placeholder="Nhập username hoặc email để tìm kiếm..."
                  value={searchInput}
                  onSearch={(v) => {
                    setSearchInput(v);
                  }}
                  loading={searchingUser}
                  showClearButton={false}
                />
                {showSearchResults && ((searchResults || []).length > 0 || searchingUser) ? (
                  <UserSearchResults
                    results={searchResults || []}
                    loading={searchingUser}
                    onSelect={handleSelectUser}
                  />
                ) : null}
                {!searchingUser && debouncedSearch && (searchResults || []).length === 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <AlertCircle className="size-3" />
                    Không tìm thấy người dùng "{debouncedSearch}"
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Selected user info */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="size-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {userInfo?.displayName || userInfo?.username || "Đang tải..."}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    @{userInfo?.username} — {userInfo?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Số dư hiện tại</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatVND(userInfo?.currentBalance || 0)}đ
                  </p>
                </div>
                <Button
                  onClick={() => setShowAdjustDialog(true)}
                  className="shrink-0"
                >
                  <Wallet className="mr-2 size-4" />
                  Điều chỉnh
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearUser}
                  title="Tìm người dùng khác"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </GlassCard>

      {/* Balance Log Section (only when user selected) */}
      {selectedUserId && (
        <div className="space-y-4">
          {/* Filters */}
          <GlassCard>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    exportTableToCsv(
                      entries.map((e) => ({
                        ...e,
                        type: typeLabelsLookup[e.type || "admin_adjust"] || e.type,
                        amount: `${(e.amount || 0) > 0 ? "+" : ""}${formatVND(Math.abs(e.amount || 0))}đ`,
                        balanceBefore: `${formatVND(e.balanceBefore ?? 0)}đ`,
                        balanceAfter: `${formatVND(e.balanceAfter ?? 0)}đ`,
                        timestamp: formatDate(e.timestamp),
                      })),
                      CSV_COLUMNS,
                      `balance_log_${selectedUserId}_${Date.now()}.csv`,
                    )
                  }
                  disabled={entries.length === 0}
                  className="w-full sm:w-auto"
                >
                  <Download className="size-4 mr-1" />
                  Export CSV
                </Button>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground shrink-0">Từ</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                      className="flex-1 sm:w-[140px] h-8 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground shrink-0">Đến</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                      className="flex-1 sm:w-[140px] h-8 text-xs"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className={cn("size-4 mr-1", loading && "animate-spin")} />
                  Làm mới
                </Button>
              </div>
            </CardContent>
          </GlassCard>

          {/* Table */}
          <DataTable
            columns={columns}
            data={entries}
            loading={loading}
            pageSize={20}
            totalItems={pagination.totalItems}
            currentPage={pagination.currentPage}
            onPageChange={handlePageChange}
            emptyState={
              <EmptyState
                icon={History}
                title="Chưa có biến động số dư"
                description="Lịch sử giao dịch và điều chỉnh số dư sẽ hiển thị ở đây"
              />
            }
          />
        </div>
      )}

      {/* No user selected state */}
      {!selectedUserId && (
        <div className="flex-1 flex items-center justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <Users className="size-8 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Chọn người dùng để xem</EmptyTitle>
              <EmptyDescription>
                Tìm kiếm người dùng ở ô phía trên để xem lịch sử số dư và điều chỉnh
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}

      {/* Adjust Balance Dialog */}
      {selectedUserId && userInfo && (
        <AdjustBalanceDialog
          open={showAdjustDialog}
          onOpenChange={setShowAdjustDialog}
          userId={selectedUserId}
          username={userInfo?.displayName || userInfo?.username || ""}
          currentBalance={userInfo?.currentBalance || 0}
        />
      )}
    </div>
  );
}
