import AccountTable from "@/components/admin/accounts/AccountTable";
import {
  FilterBar,
  FilterDropdown,
  PageHeader,
} from "@/components/admin/shared";
import SearchBar from "@/components/admin/shared/SearchBar";
import { Button } from "@/components/ui/button";
import {
  gameOptions,
  statusOptions,
  typeOptions,
} from "@/constant/account-options";
import { useAdminAccountStore } from "@/stores/useAdminAccountStore";
import type { Account } from "@/types/admin/account.type";
import { Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

const Accounts = () => {
  const {
    accounts,
    pagination,
    loading,
    fetchList,
    toggleStatus,
    deleteAccount,
  } = useAdminAccountStore();
  const [filters, setFilters] = useState({
    search: "",
    game: [] as string[],
    type: [] as string[],
    status: [] as string[],
    page: 1,
    limit: 10,
  });
  // State quản lý modal Form
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  useEffect(() => {
    fetchList(filters);
  }, [fetchList, filters]);

  const handleRefresh = () => fetchList(filters); // Refresh với filters hiện tại

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 })); // Reset về trang 1 khi search
  };

  const handleMultiFilterChange = (
    field: "game" | "type" | "status",
    values: string[],
  ) => {
    setFilters((prev) => ({ ...prev, [field]: values, page: 1 }));
  };

  const handleReset = () => {
    setFilters({
      search: "",
      game: [],
      type: [],
      status: [],
      page: 1,
      limit: 10,
    });
  };

  const hasActiveFilters = Boolean(
    filters.search.trim() ||
      filters.game.length > 0 ||
      filters.type.length > 0 ||
      filters.status.length > 0,
  );

  const handleEdit = (id: string) => {
    const account = accounts.find((a) => a._id === id);
    if (account) {
      setEditingAccount(account); // Set data để pre-fill form
      setShowForm(true); // Mở modal
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn ${currentStatus ? "ẩn" : "hiển thị"} tài khoản này?`,
      )
    )
      return;
    await toggleStatus(id, !currentStatus);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa tài khoản này? Hành động không thể hoàn tác.")) return;
    await deleteAccount(id);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAccount(null);
    fetchList({ ...filters, page: 1 }); // Refresh list với filters hiện tại
  };

  return (
    <div className="container-wrapper py-4">
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader
          title=" Quản lý tài khoản game"
          description="Quản lý tài khoản game ở đây. Thêm, sửa, ẩn/hiện tài khoản để bán"
          actions={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
              <Button
                className="w-full sm:w-auto"
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
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
              value={filters.search}
              onSearch={handleSearch}
              loading={loading} // Hiển thị loading icon khi đang fetch
            />
          </div>
          <div className="w-full sm:w-[180px] lg:w-[200px]">
            <FilterDropdown
              placeholder="Game"
              multiple
              values={filters.game}
              onValuesChange={(values) => handleMultiFilterChange("game", values)}
              options={gameOptions.filter((option) => Boolean(option.value))}
            />
          </div>

          <div className="w-full sm:w-[140px] lg:w-[150px]">
            <FilterDropdown
              placeholder="Loại"
              multiple
              values={filters.type}
              onValuesChange={(values) => handleMultiFilterChange("type", values)}
              options={typeOptions.filter((option) => Boolean(option.value))}
            />
          </div>

          <div className="w-full sm:w-[180px] lg:w-[200px]">
            <FilterDropdown
              placeholder="Trạng thái"
              multiple
              values={filters.status}
              onValuesChange={(values) =>
                handleMultiFilterChange("status", values)
              }
              options={statusOptions.filter((option) => Boolean(option.value))}
            />
          </div>
        </FilterBar>

        <AccountTable
          accounts={accounts}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          onPageSizeChange={(limit) =>
            setFilters((prev) => ({ ...prev, limit, page: 1 }))
          }
          onEdit={handleEdit}
          onToggleStatus={handleToggle}
          onDelete={handleDelete}
        />
      </div>

      {/* <AccountForm
        account={editingAccount}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingAccount(null);
        }}
        onSuccess={handleFormSuccess}
      /> */}
    </div>
  );
};

export default Accounts;
