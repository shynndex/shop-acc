// ⚠️ DEPRECATED: Data fetching migrated to TanStack Query hooks in useAdminQueries.ts
import { create } from "zustand";

type UserBalanceStore = { _deprecated: true };

export const useAdminUserBalanceStore = create<UserBalanceStore>(() => ({
  _deprecated: true,
}));
