import { DepositDetailModal } from "@/components/admin/deposits/DepositDetailModal";
import DepositTable from "@/components/admin/deposits/DepositTable";
import {
  DataTable,
  FilterBar,
  FilterDropdown,
  PageHeader,
  BulkActionBar,
} from "@/components/admin/shared";
import SearchBar from "@/components/admin/shared/SearchBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useDepositsQuery, useUpdateDepositStatus } from "@/hooks/queries/useAdminQueries";
import { useFilterParams } from "@/hooks/useFilterParams";
import { useExportCsv } from "@/hooks/useExportCsv";
import { depositService } from "@/services/admin/deposit.service";
import type { Deposit } from "@/types/admin/deposit.type";
import { AlertCircle, Download, RefreshCw, Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState, useCallback, useMemo } from "react";
import { queryKeys } from "@/hooks/queries/useAdminQueries";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

const FILTER_CONFIGS = [
  { key: "search", defaultValue: "" },
  { key: "status", defaultValue: "" },
  { key: "type", defaultValue: "" },
  { key: "page", defaultValue: 1, numeric: true },
  { key: "limit", defaultValue: 15, numeric: true },
] as const;

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "SUCCESS", label: "Thành công" },
  { value: "FAILED", label: "Thất bại" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const typeOptions = [
  { value: "", label: "Tất cả loại" },
  { value: "bank", label: "Chuyển khoản" },
  { value: "card", label: "Thẻ cào" },
];

const Deposit = () => {
  const qc = useQueryClient();

  const { filters, setFilter, setFilters, resetFilters, hasActiveFilters } = useFilterParams(FILTER_CONFIGS);

  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useDepositsQuery(filters);
  const { mutateAsync: updateStatus } = useUpdateDepositStatus();
  const { handleExport, exporting } = useExportCsv(depositService.exportCsv);

  const deposits: Deposit[] = data?.deposits || [];
  const pagination = {
    currentPage: data?.currentPage || 1,
    totalPages: data?.totalPages || 1,
    totalItems: data?.totalItems || 0,
  };
  const loading = isLoading && !data;

  // Selected deposit IDs for bulk actions
  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  const handleViewDetail = useCallback((deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setShowDetailModal(true);
  }, []);

  const handleUpdateStatus = useCallback(
    async (id: string, status: "PAID" | "FAILED" | "CANCELLED", note?: string) => {
      await updateStatus({ id, payload: { status, adminNote: note } });
    },
    [updateStatus],
  );

  // ── Bulk Actions ─────────────────────────────────────────────
  const handleBulkApprove = useCallback(async () => {
    const count = selectedIds.length;
    if (!confirm(`Duyệt ${count} giao dịch đã chọn?`)) return;
    try {
      await Promise.all(selectedIds.map((id) => updateStatus({ id, payload: { status: "PAID" as const } })));
      toast.success(`Đã duyệt ${count} giao dịch`);
      setRowSelection({});
    } catch {
      toast.error("Có lỗi xảy ra khi duyệt giao dịch");
    }
  }, [selectedIds, updateStatus]);

  const handleBulkReject = useCallback(async () => {
    const count = selectedIds.length;
    if (!confirm(`Từ chối ${count} giao dịch đã chọn?`)) return;
    try {
      await Promise.all(selectedIds.map((id) => updateStatus({ id, payload: { status: "FAILED" as const } })));
      toast.success(`Đã từ chối ${count} giao dịch`);
      setRowSelection({});
    } catch {
      toast.error("Có lỗi xảy ra khi từ chối giao dịch");
    }
  }, [selectedIds, updateStatus]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Quản lý giao dịch nạp tiền"
        description="Theo dõi, duyệt và xuất báo cáo giao dịch nạp tiền"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => handleExport(filters, `deposits_${Date.now()}.csv`)}
              disabled={loading || exporting}
            >
              <Download className="mr-2 size-4" />
              {exporting ? "Đang xuất..." : "Export CSV"}
            </Button>
            <Button
              variant="outline"
              onClick={() => qc.invalidateQueries({ queryKey: queryKeys.deposits.all })}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </>
        }
      />

      <FilterBar
        showReset={hasActiveFilters}
        onReset={resetFilters}
      >
        <div className="flex-1 min-w-[250px]">
          <SearchBar
            placeholder="Tìm theo username hoặc email..."
            value={filters.search as string}
            onSearch={(v) => setFilter("search", v)}
          />
        </div>
        <div className="w-[180px]">
          <FilterDropdown
            placeholder="Trạng thái"
            value={filters.status as string}
            onChange={(v) => setFilter("status", v)}
            options={statusOptions}
          />
        </div>
        <div className="w-[180px]">
          <FilterDropdown
            placeholder="Loại nạp"
            value={filters.type as string}
            onChange={(v) => setFilter("type", v)}
            options={typeOptions}
          />
        </div>
      </FilterBar>

      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.length}
          onClearSelection={() => setRowSelection({})}
          actions={[
            {
              label: "Duyệt",
              variant: "default",
              icon: <Check className="mr-1.5 size-3.5" />,
              onClick: handleBulkApprove,
            },
            {
              label: "Từ chối",
              variant: "destructive",
              icon: <X className="mr-1.5 size-3.5" />,
              onClick: handleBulkReject,
            },
          ]}
        />
      )}

      <DepositTable
        deposits={deposits}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setFilter("page", page)}
        onPageSizeChange={(size) => setFilters({ limit: size, page: 1 })}
        onViewDetail={(deposit) => handleViewDetail(deposit)}
        onApprove={async (id) => {
          if (!confirm("Bạn có chắc chắn muốn duyệt giao dịch này?")) return;
          await updateStatus({ id, payload: { status: "PAID" } });
        }}
        onReject={async (id) => {
          if (!confirm("Bạn có chắc chắn muốn từ chối giao dịch này?")) return;
          await updateStatus({ id, payload: { status: "FAILED" } });
        }}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

      <DepositDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        deposit={selectedDeposit}
        onUpdateStatus={handleUpdateStatus}
        loading={loading}
      />
    </div>
  );
};

export default Deposit;
