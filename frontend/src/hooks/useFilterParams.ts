import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

type FilterValue = string | string[] | number | boolean | undefined | null;

interface FilterConfig {
  key: string;
  defaultValue: FilterValue;
  /** Whether this is a multi-value filter (comma-separated in URL) */
  multi?: boolean;
  /** Whether this is a numeric filter */
  numeric?: boolean;
}

/**
 * useFilterParams — Sync filter state to URL search params.
 *
 * Example:
 *   const [filters, setFilters] = useFilterParams([
 *     { key: "search", defaultValue: "" },
 *     { key: "status", defaultValue: "" },
 *     { key: "page", defaultValue: 1, numeric: true },
 *     { key: "limit", defaultValue: 15, numeric: true },
 *     { key: "game", defaultValue: [], multi: true },
 *   ]);
 */
export function useFilterParams(configs: FilterConfig[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read current values from URL
  const filters = useMemo(() => {
    const result: Record<string, FilterValue> = {};
    for (const { key, defaultValue, multi, numeric } of configs) {
      const raw = searchParams.get(key);
      if (raw === null || raw === "") {
        result[key] = defaultValue;
      } else if (multi) {
        result[key] = raw ? raw.split(",").filter(Boolean) : defaultValue;
      } else if (numeric) {
        const num = Number(raw);
        result[key] = isNaN(num) ? defaultValue : num;
      } else {
        result[key] = raw;
      }
    }
    return result;
  }, [searchParams, configs]);

  // Update a single filter key (resets page to 1 unless page key)
  const setFilter = useCallback(
    (key: string, value: FilterValue) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const shouldResetPage = key !== "page";

        if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
          next.delete(key);
        } else if (Array.isArray(value)) {
          next.set(key, value.join(","));
        } else {
          next.set(key, String(value));
        }

        // Reset to page 1 when any non-pagination filter changes
        if (shouldResetPage) {
          next.set("page", "1");
        }

        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  // Update multiple filters at once
  const setFilters = useCallback(
    (updates: Record<string, FilterValue>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        let hasFilterChange = false;

        for (const [key, value] of Object.entries(updates)) {
          if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
            next.delete(key);
          } else if (Array.isArray(value)) {
            next.set(key, value.join(","));
          } else {
            next.set(key, String(value));
          }
          if (key !== "page") {
            hasFilterChange = true;
          }
        }

        // Reset to page 1 when any non-pagination filter changes
        if (hasFilterChange) {
          next.set("page", "1");
        }

        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  // Reset all filters to defaults
  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // Check if any filter is active (non-default)
  const hasActiveFilters = useMemo(() => {
    return configs.some(({ key, defaultValue }) => {
      const value = filters[key];
      if (Array.isArray(value) && Array.isArray(defaultValue)) {
        return value.length !== defaultValue.length;
      }
      return value !== defaultValue;
    });
  }, [filters, configs]);

  return { filters, setFilter, setFilters, resetFilters, hasActiveFilters };
}
