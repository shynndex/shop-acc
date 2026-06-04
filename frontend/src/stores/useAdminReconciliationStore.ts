// ⚠️ DEPRECATED: Data fetching migrated to TanStack Query hooks in useAdminQueries.ts
import { create } from "zustand";

type ReconStore = { _deprecated: true };

export const useAdminReconciliationStore = create<ReconStore>(() => ({
  _deprecated: true,
}));
