import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────

export interface UseAsyncState<T> {
  /** The resolved data from the async function */
  data: T | null;
  /** Whether the async function is currently executing */
  loading: boolean;
  /** Error object if the async function threw */
  error: Error | null;
}

export interface UseAsyncReturn<T> extends UseAsyncState<T> {
  /** Re-run the async function (useful for retry/refresh) */
  retry: () => void;
}

// ─── Hook ───────────────────────────────────────────────────────────────

/**
 * useAsync — A generic hook for managing async operations.
 *
 * Automatically calls the provided async function on mount and whenever
 * dependencies change. Handles:
 *   - Loading state
 *   - Error state with Error object
 *   - Data state with the resolved value
 *   - Component unmount (prevents state updates on unmounted components)
 *   - Race conditions (stale requests are ignored)
 *   - Manual retry via `retry()`
 *
 * @typeParam T - The shape of the resolved data
 * @param asyncFn - The async function to execute
 * @param deps - Dependencies array (re-runs when deps change), defaults to []
 *
 * @example
 * ```tsx
 * const { data, loading, error, retry } = useAsync(
 *   () => api.get<User[]>("/users"),
 *   []
 * );
 *
 * if (loading) return <Loading />;
 * if (error) return <Error message={error.message} onRetry={retry} />;
 * return <DataTable data={data} />;
 * ```
 */
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = [],
): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  // Track if the component is mounted and the current request ID
  // to prevent state updates after unmount and handle race conditions.
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const execute = useCallback(() => {
    const requestId = ++requestIdRef.current;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    asyncFn()
      .then((result) => {
        // Only update state if this is still the latest request
        // AND the component is still mounted
        if (requestId === requestIdRef.current && mountedRef.current) {
          setState({ data: result, loading: false, error: null });
        }
      })
      .catch((err: unknown) => {
        if (requestId === requestIdRef.current && mountedRef.current) {
          const error =
            err instanceof Error ? err : new Error(String(err));
          setState({ data: null, loading: false, error });
        }
      });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    execute();

    return () => {
      mountedRef.current = false;
    };
  }, [execute]);

  return {
    ...state,
    retry: execute,
  };
}
