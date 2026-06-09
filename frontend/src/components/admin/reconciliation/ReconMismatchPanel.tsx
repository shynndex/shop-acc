import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterBar, FilterDropdown } from "@/components/admin/shared";
import { cn, formatVND, formatDate } from "@/lib/utils";
import { useReconMismatchesQuery, useResolveMismatch } from "@/hooks/queries/useAdminQueries";
import type { MismatchAlertItem, MismatchType } from "@/types/admin/reconciliation.type";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  GitCompareArrows,
  Hash,
  Layers,
  ShieldAlert,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { SkeletonCard } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty"

const mismatchTypeConfig: Record<
  MismatchType,
  { label: string; icon: React.ElementType; color: string }
> = {
  order_amount_mismatch: {
    label: "Chênh lệch Amount",
    icon: Hash,
    color: "text-orange-600 bg-orange-500/10 border-orange-200",
  },
  order_status_mismatch: {
    label: "Status Mismatch",
    icon: AlertTriangle,
    color: "text-amber-600 bg-amber-500/10 border-amber-200",
  },
  orphan_deposit: {
    label: "Deposit mồ côi",
    icon: Layers,
    color: "text-red-600 bg-red-500/10 border-red-200",
  },
  serial_pin_duplicate: {
    label: "Serial/Pin trùng",
    icon: Copy,
    color: "text-purple-600 bg-purple-500/10 border-purple-200",
  },
  bank_amount_mismatch: {
    label: "Bank Amount",
    icon: GitCompareArrows,
    color: "text-blue-600 bg-blue-500/10 border-blue-200",
  },
  abnormal_deposit: {
    label: "Nạp bất thường",
    icon: ShieldAlert,
    color: "text-pink-600 bg-pink-500/10 border-pink-200",
  },
  abnormal_pending: {
    label: "PENDING bất thường",
    icon: Clock,
    color: "text-yellow-600 bg-yellow-500/10 border-yellow-200",
  },
};


const statusFilterOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chưa xử lý" },
  { value: "resolved", label: "Đã xử lý" },
];

const typeFilterOptions = [
  { value: "", label: "Tất cả loại" },
  { value: "order_amount_mismatch", label: "Chênh lệch Amount" },
  { value: "order_status_mismatch", label: "Status Mismatch" },
  { value: "orphan_deposit", label: "Deposit mồ côi" },
  { value: "bank_amount_mismatch", label: "Bank Amount" },
  { value: "abnormal_deposit", label: "Nạp bất thường" },
  { value: "abnormal_pending", label: "PENDING bất thường" },
];

export function ReconMismatchPanel() {
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useReconMismatchesQuery({
    page,
    limit,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  });

  const resolveMutation = useResolveMismatch();

  const mismatches = data?.mismatches || [];
  const stats = data?.stats || { pending: 0, resolved: 0 };
  const totalPages = data?.totalPages || 1;

  const handleResolve = useCallback(
    async (id: string) => {
      try {
        await resolveMutation.mutateAsync(id);
        toast.success("Đã xử lý alert");
      } catch {
        toast.error("Không thể xử lý alert");
      }
    },
    [resolveMutation],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="gap-1">
          <AlertTriangle className="size-3" />
          {stats.pending} chưa xử lý
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="size-3" />
          {stats.resolved} đã xử lý
        </Badge>
      </div>

      {/* Filters */}
      <FilterBar
        showReset={statusFilter !== "" || typeFilter !== ""}
        onReset={() => { setStatusFilter(""); setTypeFilter(""); setPage(1); }}
      >
        <div className="w-[160px]">
          <FilterDropdown
            placeholder="Trạng thái"
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={statusFilterOptions}
          />
        </div>
        <div className="w-[200px]">
          <FilterDropdown
            placeholder="Loại mismatch"
            value={typeFilter}
            onChange={(v) => { setTypeFilter(v); setPage(1); }}
            options={typeFilterOptions}
          />
        </div>
      </FilterBar>

      {/* Mismatch List */}
      {mismatches.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Không có mismatch"
          description="Tất cả giao dịch đều khớp"
        />
      ) : (
        <div className="space-y-3">
          {mismatches.map((item) => {
            const config = mismatchTypeConfig[item.type] || mismatchTypeConfig.orphan_deposit;
            const Icon = config.icon;
            const isResolved = item.status === "resolved";

            return (
              <Card
                key={item._id}
                className={cn(
                  "transition-all",
                  isResolved && "opacity-60",
                  item.severity === "critical" && !isResolved && "border-red-300",
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg border", config.color)}>
                      <Icon className="size-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.color)}>
                          {config.label}
                        </Badge>
                        <Badge
                          variant={item.severity === "critical" ? "destructive" : "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {item.severity === "critical" ? "Nghiêm trọng" : "Cảnh báo"}
                        </Badge>
                        {isResolved && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700">
                            <CheckCircle2 className="size-2.5 mr-0.5" />
                            Đã xử lý
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm mt-1.5">{item.message}</p>

                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        {item.user && (
                          <span className="flex items-center gap-1">
                            <User className="size-3" />
                            {item.user.username || "unknown"}
                          </span>
                        )}
                        <span>{formatDate(item.createdAt)}</span>
                        {item.resolvedAt && (
                          <span className="text-green-600">
                            Xử lý: {formatDate(item.resolvedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {!isResolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs shrink-0"
                        onClick={() => handleResolve(item._id)}
                        disabled={resolveMutation.isPending}
                      >
                        <CheckCircle2 className="size-3 mr-1" />
                        Xử lý
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Trang {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
