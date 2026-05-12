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
        "flex flex-wrap items-center gap-3 p-4 border rounded-lg bg-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3 flex-1">{children}</div>
      {showReset && onReset && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <Button
            className="text-muted-foreground hover:text-foreground"
            variant="ghost"
            size="sm"
            onClick={onReset}
          >
            <X className="mr-1 size-4" />
            {resetLabel}
          </Button>
        </>
      )}
    </div>
  );
};

export default FilterBar;
