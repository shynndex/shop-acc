import AuditDetailDialog from "./AuditDetailDialog";
import {
  DataTable,
  FilterBar,
  FilterDropdown,
  PageHeader,
} from "@/components/admin/shared";
import SearchBar from "@/components/admin/shared/SearchBar";
import { DateRangeFilter } from "@/components/admin/analytics/DateRangeFilter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuditLogsQuery } from "@/hooks/queries/useAdminQueries";
import { useFilterParams } from "@/hooks/useFilterParams";
import { useExportCsv } from "@/hooks/useExportCsv";
import { auditService } from "@/services/admin/audit.service";
import { AlertCircle, Download, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AuditColumns } from "@/components/admin/audit/AuditColumns";
import type { AuditLog } from "@/types/admin/audit.type";
import { queryKeys } from "@/hooks/queries/useAdminQueries";

const FILTER_CONFIGS = [
  { key: "search", defaultValue: "" },
  { key: "action", defaultValue: "" },
  { key: "resource", defaultValue: "" },
  { key: "dateFrom", defaultValue: "" },
  { key: "dateTo", defaultValue: "" },
  { key: "page", defaultValue: 1, numeric: true },
  { key: "limit", defaultValue: 20, numeric: true },
] as const;

const actionOptions = [
  { value: "", label: "Tất cả hành động" },
  { value: "account:create", label: "Tạo tài khoản" },
  { value: "account:update", label: "Cập nhật tài khoản" },
  { value: "account:toggle", label: "Ẩn/Hiện tài khoản" },
  { value: "account:delete", label: "Xóa tài khoản" },
  { value: "deposit:approve", label: "Duyệt nạp tiền" },
  { value: "deposit:reject", label: "Từ chối nạp tiền" },
  { value: "deposit:cancel", label: "Hủy giao dịch" },
  { value: "giftcode:create", label: "Tạo mã giảm giá" },
  { value: "giftcode:update", label: "Cập nhật mã" },
  { value: "giftcode:delete", label: "Xóa mã giảm giá" },
  { value: "review:approve", label: "Duyệt đánh giá" },
  { value: "review:reject", label: "Từ chối đánh giá" },
  { value: "balance:adjust", label: "Điều chỉnh số dư" },
  { value: "admin:login", label: "Đăng nhập" },
  { value: "admin:logout", label: "Đăng xuất" },
];

const resourceOptions = [
  { value: "", label: "Tất cả tài nguyên" },
  { value: "account", label: "Tài khoản game" },
  { value: "deposit", label: "Nạp tiền" },
  { value: "giftcode", label: "Mã giảm giá" },
  { value: "review", label: "Đánh giá" },
  { value: "user_balance", label: "Số dư người dùng" },
  { value: "auth", label: "Xác thực" },
];

const AuditLogs = () => {
  const qc = useQueryClient();

  const { filters, setFilter, setFilters, resetFilters, hasActiveFilters } = useFilterParams(FILTER_CONFIGS);

  const [tempDateFrom, setTempDateFrom] = useState("");
  const [tempDateTo, setTempDateTo] = useState("");

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const { data, isLoading } = useAuditLogsQuery(
    filters as unknown as {
      search: string;
      action: string;
      resource: string;
      dateFrom: string;
      dateTo: string;
      page: number;
      limit: number;
    },
  );
  const { handleExport, exporting } = useExportCsv(auditService.exportCsv);

  const logs: AuditLog[] = data?.logs || [];
  const pagination = {
    currentPage: data?.currentPage || 1,
    totalPages: data?.totalPages || 1,
    totalItems: data?.totalItems || 0,
  };
  const loading = isLoading && !data;

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetail(true);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Nhật ký hoạt động"
        description="Theo dõi tất cả hành động của quản trị viên trong hệ thống"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport(filters, `audit_logs_${Date.now()}.csv`)}
              disabled={loading || exporting}
            >
              <Download className="mr-2 size-4" />
              {exporting ? "Đang xuất..." : "Export CSV"}
            </Button>
            <Button
              variant="outline"
              onClick={() => qc.invalidateQueries({ queryKey: queryKeys.auditLogs.all })}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
          </div>
        }
      />

      <DateRangeFilter
        from={tempDateFrom}
        to={tempDateTo}
        onFromChange={setTempDateFrom}
        onToChange={setTempDateTo}
        onApply={() =>
          setFilters({
            dateFrom: tempDateFrom,
            dateTo: tempDateTo,
          })
        }
        loading={loading}
      />

      <FilterBar
        showReset={hasActiveFilters}
        onReset={() => {
          resetFilters();
          setTempDateFrom("");
          setTempDateTo("");
        }}
      >
        <div className="flex-1 min-w-0 sm:min-w-[250px]">
          <SearchBar
            placeholder="Tìm theo tên admin, ID hoặc hành động..."
            value={filters.search as string}
            onSearch={(v) => setFilter("search", v)}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <FilterDropdown
            placeholder="Hành động"
            value={filters.action as string}
            onChange={(v) => setFilter("action", v)}
            options={actionOptions}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <FilterDropdown
            placeholder="Tài nguyên"
            value={filters.resource as string}
            onChange={(v) => setFilter("resource", v)}
            options={resourceOptions}
          />
        </div>
      </FilterBar>

      <DataTable
        columns={AuditColumns}
        data={logs}
        loading={loading}
        pageSize={filters.limit as number}
        totalItems={pagination.totalItems}
        currentPage={pagination.currentPage}
        onPageChange={(page) => setFilter("page", page)}
        onPageSizeChange={(size) => setFilters({ limit: size, page: 1 })}
        onRowClick={(log) => handleViewDetail(log)}
      />

      <AuditDetailDialog
        open={showDetail}
        onOpenChange={setShowDetail}
        log={selectedLog}
      />
    </div>
  );
};

export default AuditLogs;
