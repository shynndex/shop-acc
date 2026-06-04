import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlassVariant = "default" | "strong" | "subtle";

interface GlassCardProps {
  children: ReactNode;
  variant?: GlassVariant;
  hover?: boolean;
  gradientBorder?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantClasses: Record<GlassVariant, string> = {
  default: "glass",
  strong: "glass-strong",
  subtle: "glass-subtle",
};

export function GlassCard({
  children,
  variant = "default",
  hover = false,
  gradientBorder = false,
  className,
  onClick,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4",
        variantClasses[variant],
        hover &&
          "transition-all duration-300 hover:shadow-glow hover:scale-[1.02] cursor-pointer",
        gradientBorder && "border-gradient-brand",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
