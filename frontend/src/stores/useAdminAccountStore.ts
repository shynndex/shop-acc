import { create } from "zustand";
import { toast } from "sonner";
import type { AccountState } from "@/types/admin/store.type";
import { accountService } from "@/services/admin/account.service";

export const useAdminAccountStore = create<AccountState>((set, get) => ({
  // initial state
  accounts: [],
  pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
  loading: false,
  error: null,

  fetchList: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await accountService.list(params);
      set({
        accounts: data.accounts,
        pagination: {
          currentPage: data.currentPage,
          totalItems: data.totalItems,
          totalPages: data.totalPages,
        },
        loading: false,
      });
    } catch (error: any) {
      const message = error?.message || "Không thể tải danh sách tài khoản";
      set({ error: message });
      toast.error(message);
    } finally {
      set({ loading: false });
    }
  },

  createAccount: async (payload) => {
    set({ loading: true, error: null });
    try {
      const account = await accountService.create(payload);
      toast.success("Đã tạo tài khoản thành công");

      // Refresh list để cập nhật UI
      await get().fetchList({ page: 1 });
      return account;
    } catch (error: any) {
      const message = error?.message || "Không thể tạo tài khoản";
      set({ error: message });
      toast.error(message);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateAccount: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const account = await accountService.update(id, payload);
      toast.success("Đã cập nhật tài khoản thành công");

      // Update local state instead of full refresh (optimistic update)
      set((state) => ({
        accounts: state.accounts.map((acc) => (acc._id === id ? account : acc)),
      }));
      return account;
    } catch (error: any) {
      const message = error?.message || "Lỗi khi cập nhật tài khoản";
      set({ error: message });
      toast.error(message);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  toggleStatus: async (id, isActive) => {
    // Optimistic update: update UI ngay trước khi API call xong
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc._id === id ? { ...acc, isActive } : acc,
      ),
    }));

    try {
      const account = await accountService.toggleStatus(id, isActive);
      toast.success(isActive ? "Đã hiển thị tài khoản" : "Đã ẩn tài khoản");
      return account;
    } catch (error: any) {
      // Rollback nếu API fail
      await get().fetchList({ page: get().pagination.currentPage });
      const message = error?.message || "Lỗi khi cập nhật trạng thái";
      set({ error: message });
      toast.error(message);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  deleteAccount: async (id) => {
    set({ loading: true, error: null });
    try {
      await accountService.delete(id);
      toast.success("Đã xóa tài khoản");

      // Remove from local state instead of full refresh
      set((state) => ({
        accounts: state.accounts.filter((acc) => acc._id !== id),
        loading: false,
      }));
      return true;
    } catch (error: any) {
      const message = error?.message || "Lỗi khi xóa tài khoản";
      set({ error: message, loading: false });
      toast.error(message);
      return false;
    }
  },

  clearError: () => set({ error: null }),

  //Set accounts directly (useful for manual refresh)
  setAccounts: (accounts) => set({ accounts }),
}));
