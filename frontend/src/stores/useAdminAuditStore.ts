// ⚠️ DEPRECATED: Data fetching migrated to TanStack Query hooks in useAdminQueries.ts
import { create } from "zustand";

type AuditStore = { _deprecated: true };

export const useAdminAuditStore = create<AuditStore>(() => ({
  _deprecated: true,
}));
