import AccountTable from "@/components/admin/accounts/AccountTable";
import AccountForm from "@/components/admin/accounts/AccountForm";
import {
  FilterBar,
  FilterDropdown,
  PageHeader,
  BulkActionBar,
} from "@/components/admin/shared";
import SearchBar from "@/components/admin/shared/SearchBar";
import { Button } from "@/components/ui/button";
import {
  gameOptions,
  statusOptions,
  typeOptions,
} from "@/constant/account-options";
import { useAccountsQuery, useCreateAccount, useUpdateAccount, useToggleAccountStatus, useDeleteAccount } from "@/hooks/queries/useAdminQueries";
import { useFilterParams } from "@/hooks/useFilterParams";
import { useExportCsv } from "@/hooks/useExportCsv";
import { accountService } from "@/services/admin/account.service";
import type { Account, CreateAccountPayload, UpdateAccountPayload } from "@/types/admin/account.type";
import { Download, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import { queryKeys } from "@/hooks/queries/useAdminQueries";

const FILTER_CONFIGS = [
  { key: "search", defaultValue: "" },
  { key: "game", defaultValue: [] as string[], multi: true },
  { key: "type", defaultValue: [] as string[], multi: true },
  { key: "status", defaultValue: [] as string[], multi: true },
  { key: "page", defaultValue: 1, numeric: true },
  { key: "limit", defaultValue: 10, numeric: true },
] as const;

const Accounts = () => {
  const qc = useQueryClient();

  const { filters, setFilter, setFilters, resetFilters, hasActiveFilters } = useFilterParams(FILTER_CONFIGS);

  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useAccountsQuery(filters);
  const { mutateAsync: toggleStatus } = useToggleAccountStatus();
  const { mutateAsync: deleteAccount } = useDeleteAccount();
  const { handleExport, exporting } = useExportCsv(accountService.exportCsv);

  const accounts: Account[] = data?.accounts || [];
  const pagination = {
    currentPage: data?.currentPage || 1,
    totalPages: data?.totalPages || 1,
    totalItems: data?.totalItems || 0,
  };
  const loading = isLoading && !data;

  // Selected account IDs for bulk actions
  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  const handleRefresh = () => qc.invalidateQueries({ queryKey: queryKeys.accounts.all });

  const handleSearch = useCallback(
    (value: string) => setFilter("search", value),
    [setFilter],
  );

  const handleMultiFilterChange = useCallback(
    (field: "game" | "type" | "status", values: string[]) => {
      setFilters({ [field]: values });
    },
    [setFilters],
  );

  const handleReset = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  const handleEdit = useCallback(
    (id: string) => {
      const account = accounts.find((a) => a._id === id);
      if (account) {
        setEditingAccount(account);
        setShowForm(true);
      }
    },
    [accounts],
  );

  const handleToggle = useCallback(
    async (id: string, currentStatus: boolean) => {
      if (!confirm(`Bạn có chắc chắn muốn ${currentStatus ? "ẩn" : "hiển thị"} tài khoản này?`)) return;
      await toggleStatus({ id, isActive: !currentStatus });
    },
    [toggleStatus],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Xóa tài khoản này? Hành động không thể hoàn tác.")) return;
      await deleteAccount(id);
    },
    [deleteAccount],
  );

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setEditingAccount(null);
    qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
  }, [qc]);

  // ── Bulk Actions ───────────────────────────────────────────
  const handleBulkDelete = useCallback(async () => {
    const confirmed = confirm(`Xóa ${selectedIds.length} tài khoản? Hành động không thể hoàn tác.`);
    if (!confirmed) return;
    try {
      await Promise.all(selectedIds.map((id) => deleteAccount(id)));
      toast.success(`Đã xóa ${selectedIds.length} tài khoản`);
      setRowSelection({});
    } catch {
      toast.error("Có lỗi xảy ra khi xóa tài khoản");
    }
  }, [selectedIds, deleteAccount]);

  const handleBulkToggle = useCallback(
    async (activate: boolean) => {
      try {
        await Promise.all(selectedIds.map((id) => toggleStatus({ id, isActive: activate })));
        toast.success(`Đã ${activate ? "hiển thị" : "ẩn"} ${selectedIds.length} tài khoản`);
        setRowSelection({});
      } catch {
        toast.error("Có lỗi xảy ra");
      }
    },
    [selectedIds, toggleStatus],
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <PageHeader
          title=" Quản lý tài khoản game"
          description="Quản lý tài khoản game ở đây. Thêm, sửa, ẩn/hiện tài khoản để bán"
          actions={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
              <Button
                className="w-full sm:w-auto"
                variant="outline"
                onClick={() => handleExport(filters, `accounts_${Date.now()}.csv`)}
                disabled={loading || exporting}
              >
                <Download className="mr-2 size-4" />
                {exporting ? "Đang xuất..." : "Export CSV"}
              </Button>
              <Button
                className="w-full sm:w-auto"
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  setEditingAccount(null);
                  setShowForm(true);
                }}
              >
                <Plus className="mr-2 size-4" />
                Thêm tài khoản
              </Button>
            </div>
          }
        />

        <FilterBar
          showReset={hasActiveFilters}
          onReset={handleReset}
          className="gap-2 sm:gap-3"
        >
          <div className="w-full sm:min-w-[240px] sm:flex-1 lg:min-w-[320px]">
            <SearchBar
              placeholder="Tìm theo tên hoặc username..."
              value={filters.search as string}
              onSearch={handleSearch}
              loading={loading}
            />
          </div>
          <div className="w-full sm:w-[180px] lg:w-[200px]">
            <FilterDropdown
              placeholder="Game"
              multiple
              values={filters.game as string[]}
              onValuesChange={(values) => handleMultiFilterChange("game", values)}
              options={gameOptions.filter((option) => Boolean(option.value))}
            />
          </div>
          <div className="w-full sm:w-[140px] lg:w-[150px]">
            <FilterDropdown
              placeholder="Loại"
              multiple
              values={filters.type as string[]}
              onValuesChange={(values) => handleMultiFilterChange("type", values)}
              options={typeOptions.filter((option) => Boolean(option.value))}
            />
          </div>
          <div className="w-full sm:w-[180px] lg:w-[200px]">
            <FilterDropdown
              placeholder="Trạng thái"
              multiple
              values={filters.status as string[]}
              onValuesChange={(values) => handleMultiFilterChange("status", values)}
              options={statusOptions.filter((option) => Boolean(option.value))}
            />
          </div>
        </FilterBar>

        {selectedIds.length > 0 && (
          <BulkActionBar
            selectedCount={selectedIds.length}
            onClearSelection={() => setRowSelection({})}
            actions={[
              {
                label: "Hiển thị",
                variant: "default",
                onClick: () => handleBulkToggle(true),
              },
              {
                label: "Ẩn",
                variant: "secondary",
                onClick: () => handleBulkToggle(false),
              },
              {
                label: "Xóa",
                variant: "destructive",
                icon: <Trash2 className="mr-1.5 size-3.5" />,
                onClick: handleBulkDelete,
              },
            ]}
          />
        )}

        <AccountTable
          accounts={accounts}
          loading={loading}
          pageSize={filters.limit as number}
          pagination={pagination}
          onPageChange={(page) => setFilter("page", page)}
          onPageSizeChange={(limit) => setFilters({ limit, page: 1 })}
          onEdit={handleEdit}
          onToggleStatus={handleToggle}
          onDelete={handleDelete}
          enableRowSelection
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
        />
      <AccountForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingAccount(null);
        }}
        initialData={editingAccount}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default Accounts;
