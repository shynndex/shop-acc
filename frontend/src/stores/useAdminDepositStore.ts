// ⚠️ DEPRECATED: Data fetching migrated to TanStack Query hooks in useAdminQueries.ts
import { create } from "zustand";

type DepositStore = { _deprecated: true };

export const useAdminDepositStore = create<DepositStore>(() => ({
  _deprecated: true,
}));
