import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type GradientButtonSize = "sm" | "md" | "lg";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: GradientButtonSize;
  loading?: boolean;
  glow?: boolean;
  children: ReactNode;
}

const sizeClasses: Record<GradientButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-8 text-base gap-2.5",
};

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  (
    {
      size = "md",
      loading = false,
      glow = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium",
          "bg-gradient-brand text-white",
          "transition-all duration-300",
          "hover:bg-gradient-brand-hover hover:shadow-glow",
          "active:scale-[0.97]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          glow && "animate-glow-pulse",
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Đang xử lý...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

GradientButton.displayName = "GradientButton";
