import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import React from "react";

export interface PageHeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
  showSeparator?: boolean;
  titleSize?: "sm" | "md" | "lg" | "xl";
}

const PageHeader = ({
  title,
  description,
  actions,
  breadcrumbs,
  className,
  showSeparator = true,
  titleSize = "xl",
}: PageHeaderProps) => {
  const titleSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };
  return (
    <>
      <div className={cn("flex flex-col gap-4", className)}>
        {breadcrumbs && (
          <div className="text-sm text-muted-foreground">{breadcrumbs}</div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h1
              className={cn(
                "font-bold tracking-tight",
                titleSizeClasses[titleSize],
              )}
            >
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end md:w-auto md:flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
      {showSeparator && <Separator className="my-4" />}
    </>
  );
};

export default PageHeader;
