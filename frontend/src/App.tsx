import { Toaster } from "sonner";
import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AppRouter } from "./routes";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useThemeStore } from "./stores/useThemeStore";

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30s trước khi data được coi là stale
            gcTime: 5 * 60_000, // 5 phút cache trong garbage collector
            retry: 1, // Retry 1 lần nếu fail
            refetchOnWindowFocus: false, // Tắt refetch khi focus window
          },
        },
      }),
  );

  const initTheme = useThemeStore((s) => s.init);
  useEffect(() => {
    const cleanup = initTheme();
    return cleanup;
  }, [initTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <AppRouter />
        </Suspense>
      </ErrorBoundary>
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

export default App;
