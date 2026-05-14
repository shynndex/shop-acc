import AccountTable from "@/components/admin/accounts/AccountTable";
import EmptyState from "@/components/admin/accounts/EmptyState";
import ErrorMessage from "@/components/admin/accounts/ErrorMessage";
import {
  FilterBar,
  FilterDropdown,
  PageHeader,
} from "@/components/admin/shared";
import SearchBar from "@/components/admin/shared/SearchBar";
import { Button } from "@/components/ui/button";
import { useAdminAccountStore } from "@/stores/useAdminAccountStore";
import type { Account } from "@/types/admin/account";
import { Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

//Options cho filter dropdowns
export const gameOptions = [
  { value: "", label: "Tất cả game" },
  { value: "lien-quan", label: "Liên Quân", icon: "🎮" },
  { value: "lien-minh", label: "LMHT", icon: "⚔️" },
  { value: "valorant", label: "Valorant", icon: "🔫" },
  { value: "free-fire", label: "Free Fire", icon: "🔥" },
  { value: "khac", label: "Khác", icon: "🎲" },
];

export const typeOptions = [
  { value: "", label: "Tất cả loại" },
  { value: "standard", label: "Thường" },
  { value: "vip", label: "VIP" },
  { value: "reg", label: "Reg" },
  { value: "random", label: "Random" },
];
const Accounts = () => {
  const {
    accounts,
    pagination,
    loading,
    error,
    fetchList,
    toggleStatus,
    deleteAccount,
  } = useAdminAccountStore();
  const [filters, setFilters] = useState({
    search: "",
    game: "",
    type: "",
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

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handleReset = () => {
    setFilters({ search: "", game: "", type: "", page: 1, limit: 10 });
  };

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
    <div className="container-wrapper">
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <PageHeader
          title=" Quản lý tài khoản game"
          description="Quản lý tài khoản game ở đây. Thêm, sửa, ẩn/hiện tài khoản để bán"
          actions={
            <>
              <Button
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
                onClick={() => {
                  setEditingAccount(null);
                  setShowForm(true);
                }}
              >
                <Plus className="mr-2 size-4" />
                Thêm tài khoản
              </Button>
            </>
          }
        />
      </div>

      <FilterBar showReset onReset={handleReset}>
        <div className="flex-1 min-w-[250px]">
          <SearchBar
            placeholder="Tìm theo tên hoặc username..."
            value={filters.search}
            onSearch={handleSearch}
            loading={loading} // Hiển thị loading icon khi đang fetch
          />
        </div>
        <FilterDropdown
          placeholder="Game"
          value={filters.game}
          onChange={(v) => handleFilterChange("game", v)}
          options={gameOptions}
        />
        <FilterDropdown
          placeholder="Loại"
          value={filters.type}
          onChange={(v) => handleFilterChange("type", v)}
          options={typeOptions}
        />
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
