import { DepositDetailModal } from "@/components/admin/deposits/DepositDetailModal";
import DepositTable from "@/components/admin/deposits/DepositTable";
import {
  DataTable,
  FilterBar,
  FilterDropdown,
  PageHeader,
} from "@/components/admin/shared";
import SearchBar from "@/components/admin/shared/SearchBar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAdminDepositStore } from "@/stores/useAdminDepositStore";
import type { Deposit } from "@/types/admin/deposit.type";
import { AlertCircle, Download, RefreshCw } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "FAILED", label: "Thất bại" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const typeOptions = [
  { value: "", label: "Tất cả loại" },
  { value: "bank", label: "Chuyển khoản" },
  { value: "card", label: "Thẻ cào" },
];

interface DepositFilters {
  search: string;
  status: string;
  type: string;
  page: number;
  limit: number;
}

const Deposit = () => {
  const {
    deposits,
    pagination,
    loading,
    error,
    fetchList,
    updateStatus,
    exportCsv,
  } = useAdminDepositStore();

  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleViewDetail = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (
    id: string,
    status: "PAID" | "FAILED" | "CANCELLED",
    note?: string,
  ) => {
    try {
      await updateStatus(id, { status, adminNote: note });
      fetchList(filters);
    } catch (error) {
      throw error;
    }
  };

  const [filters, setFilters] = useState<DepositFilters>({
    search: "",
    status: "",
    type: "",
    page: 1,
    limit: 15,
  });

  useEffect(() => {
    fetchList(filters);
  }, [filters, fetchList]);

  const handleExport = async () => {
    const blob = await exportCsv(filters);
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deposits-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <PageHeader
        title="Quản lý giao dịch nạp tiền"
        description="Theo dõi, duyệt và xuất báo cáo giao dịch nạp tiền"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => fetchList(filters)}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </>
        }
      />

      <FilterBar
        showReset
        onReset={() =>
          setFilters({ search: "", status: "", type: "", page: 1, limit: 15 })
        }
      >
        <div className="flex-1 min-w-[250px]">
          <SearchBar
            placeholder="Tìm theo username hoặc email..."
            value={filters.search}
            onSearch={(v) => setFilters((p) => ({ ...p, search: v, page: 1 }))}
          />
        </div>
        <div className="w-[180px]">
          <FilterDropdown
            placeholder="Trạng thái"
            value={filters.status}
            onChange={(v) => setFilters((p) => ({ ...p, status: v, page: 1 }))}
            options={statusOptions}
          />
        </div>
        <div className="w-[180px]">
          <FilterDropdown
            placeholder="Loại nạp"
            value={filters.type}
            onChange={(v) => setFilters((p) => ({ ...p, type: v, page: 1 }))}
            options={typeOptions}
          />
        </div>
      </FilterBar>

      <DepositTable
        deposits={deposits}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setFilters((p) => ({ ...p, page }))}
        onPageSizeChange={(size) =>
          setFilters((p) => ({ ...p, limit: size, page: 1 }))
        }
        onViewDetail={(deposit) => handleViewDetail(deposit)}
        onApprove={async (id) => {
          if (!confirm("Bạn có chắc chắn muốn duyệt giao dịch này?")) {
            return;
          }
          await updateStatus(id, { status: "PAID" });
        }}
        onReject={async (id) => {
          if (!confirm("Bạn có chắc chắn muốn từ chối giao dịch này?")) {
            return;
          }
          await updateStatus(id, { status: "FAILED" });
        }}
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
