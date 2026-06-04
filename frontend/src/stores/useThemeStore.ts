import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "light" | "dark" | "auto";

interface ThemeState {
  mode: ThemeMode;
  /** Resolved theme: 'light' or 'dark' (always concrete, never 'auto') */
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  /** Called once on app mount to apply initial theme + listen for system changes */
  init: () => () => void;
}

/** Apply the .dark class to <html> */
function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/** Resolve 'auto' → 'light' | 'dark' based on system preference */
function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode !== "auto") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "auto",
      resolved: "light",

      setMode: (mode: ThemeMode) => {
        const resolved = resolveMode(mode);
        applyTheme(resolved);
        set({ mode, resolved });
      },

      init: () => {
        const { mode } = get();
        const resolved = resolveMode(mode);
        applyTheme(resolved);
        set({ resolved });

        // Listen for system theme changes when in auto mode
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e: MediaQueryListEvent) => {
          if (get().mode === "auto") {
            const newResolved = e.matches ? "dark" : "light";
            applyTheme(newResolved);
            set({ resolved: newResolved });
          }
        };
        mq.addEventListener("change", handler);

        // Cleanup function
        return () => mq.removeEventListener("change", handler);
      },
    }),
    {
      name: "theme-storage",
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
);
