import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────

export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
  className?: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback component instead of the default ErrorFallback */
  fallback?: React.ReactNode | ((props: ErrorFallbackProps) => React.ReactNode);
  /** Callback fired when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Optional key to force reset the boundary (e.g., route change) */
  resetKey?: string | number | null;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ─── ErrorFallback Component ────────────────────────────────────────────

/**
 * Default fallback UI shown by ErrorBoundary when an error is caught.
 *
 * Features:
 * - Warning icon
 * - Error title + description
 * - Retry button that calls resetErrorBoundary
 * - Error details in development mode
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
  className,
}: ErrorFallbackProps) {
  const isDev = import.meta.env.DEV;

  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-[400px] w-full flex-col items-center justify-center gap-6 p-8",
        className,
      )}
    >
      {/* Error icon */}
      <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-7 text-destructive" />
      </div>

      {/* Error message */}
      <div className="flex max-w-md flex-col items-center gap-2 text-center">
        <h2 className="text-xl font-semibold tracking-tight">
          Đã xảy ra lỗi
        </h2>
        <p className="text-sm text-muted-foreground">
          {error?.message || "Có lỗi không mong muốn xảy ra. Vui lòng thử lại."}
        </p>
      </div>

      {/* Error details (dev only) */}
      {isDev && error?.stack && (
        <details className="w-full max-w-lg">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            Chi tiết lỗi (dev only)
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted p-4 text-xs text-muted-foreground">
            {error.stack}
          </pre>
        </details>
      )}

      {/* Retry button */}
      {resetErrorBoundary && (
        <Button
          variant="outline"
          size="lg"
          onClick={resetErrorBoundary}
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Thử lại
        </Button>
      )}
    </div>
  );
}

// ─── ErrorBoundary Component ─────────────────────────────────────────────

/**
 * React Error Boundary that catches JavaScript errors in its child
 * component tree and renders a fallback UI instead of crashing.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * // With custom fallback
 * <ErrorBoundary fallback={<CustomFallback />}>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * // With reset on route change
 * <ErrorBoundary resetKey={location.pathname}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    }
    // Call optional onError callback (e.g., for error reporting service)
    this.props.onError?.(error, errorInfo);
  }

  /** Reset error state to retry rendering children */
  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset boundary when resetKey changes (e.g., route change)
    if (
      this.state.hasError &&
      this.props.resetKey !== undefined &&
      this.props.resetKey !== prevProps.resetKey
    ) {
      this.handleReset();
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback render function
      if (typeof this.props.fallback === "function") {
        const FallbackComponent = this.props.fallback as (
          props: ErrorFallbackProps,
        ) => React.ReactNode;
        return FallbackComponent({
          error: this.state.error,
          resetErrorBoundary: this.handleReset,
        });
      }

      // Custom fallback node
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
