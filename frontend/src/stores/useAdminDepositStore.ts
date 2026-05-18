import { depositService } from "@/services/admin/deposit.service";
import type { AdminDepositState } from "@/types/admin/store.type";
import { toast } from "sonner";
import { create } from "zustand";

export const useAdminDepositStore = create<AdminDepositState>((set, get) => ({
  deposits: [],
  pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
  loading: false,
  error: null,

  fetchList: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await depositService.list(params);
      set({
        deposits: data.deposits,
        pagination: {
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalItems: data.totalItems,
        },
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || "Không thể tải danh sách giao dịch",
        loading: false,
      });
      toast.error("Lỗi khi tải danh sách giao dịch");
    }
  },

  updateStatus: async (id, payload) => {
    set({ loading: true });
    try {
      const updated = await depositService.updateStatus(id, payload);
      toast.success(
        payload.status === "PAID" || payload.status === "SUCCESS"
          ? "Đã duyệt thành công"
          : "Đã từ chối giao dịch",
      );

      // Optimistic update
      set((state) => ({
        deposits: state.deposits.map((d) => (d._id === id ? updated : d)),
        loading: false,
      }));

      return updated;
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái giao dịch");
    } finally {
      set({ loading: false });
    }
  },

  exportCsv: async (filters) => {
    try {
      const blob = await depositService.exportCsv(filters);
      toast.success("Đã tải xuống file CSV");
      return blob;
    } catch (error) {
      toast.error("Lỗi khi tải xuống file CSV");
      return null;
    }
  },
}));
