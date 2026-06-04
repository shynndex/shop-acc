// ⚠️ DEPRECATED: Data fetching migrated to TanStack Query hooks in useAdminQueries.ts
// Import directly from services/admin/* if needed
import { create } from "zustand";

type AccountStore = {
  _deprecated: true;
};

export const useAdminAccountStore = create<AccountStore>(() => ({
  _deprecated: true,
}));
