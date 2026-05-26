import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_COMPARE = 5;

interface CompareState {
  ids: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],

      add: (id: string) => {
        const { ids } = get();
        if (ids.includes(id)) return;
        if (ids.length >= MAX_COMPARE) return;
        set({ ids: [...ids, id] });
      },

      remove: (id: string) => {
        set({ ids: get().ids.filter((i) => i !== id) });
      },

      clear: () => set({ ids: [] }),

      has: (id: string) => get().ids.includes(id),
    }),
    {
      name: "compare-storage",
    },
  ),
);
