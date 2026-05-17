import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import React from "react";

export interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
  showReset?: boolean;
  onReset?: () => void;
  resetLabel?: string;
}

const FilterBar = ({
  children,
  className,
  showReset,
  onReset,
  resetLabel = "Đặt lại",
}: FilterBarProps) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-center sm:p-4",
        className,
      )}
    >
      <div className="flex w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center">
        {children}
      </div>
      {showReset && onReset && (
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <Separator
            orientation="vertical"
            className="hidden h-6 sm:block"
          />
          <Button
            className="w-full justify-center text-muted-foreground hover:text-foreground sm:w-auto"
            variant="ghost"
            size="sm"
            onClick={onReset}
          >
            <X className="mr-1 size-4" />
            {resetLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
