import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Loader2, Trash2, X } from "lucide-react";

export interface BulkAction {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: "default" | "destructive" | "outline" | "secondary";
  icon?: React.ReactNode;
  /** Require confirmation before executing */
  confirmMessage?: string;
}

interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  loading?: boolean;
  className?: string;
  onClearSelection?: () => void;
}

export function BulkActionBar({
  selectedCount,
  actions,
  loading = false,
  className,
  onClearSelection,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  const handleAction = async (action: BulkAction) => {
    if (action.confirmMessage && !window.confirm(action.confirmMessage)) return;
    await action.onClick();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5 shadow-sm animate-in slide-in-from-top-2",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium shrink-0">
        <span>Đã chọn <strong>{selectedCount}</strong> mục</span>
        {onClearSelection && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={onClearSelection}
            disabled={loading}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-2 flex-wrap">
        {actions.map((action, i) => (
          <Button
            key={i}
            variant={action.variant || "outline"}
            size="sm"
            onClick={() => handleAction(action)}
            disabled={loading}
            className="h-8"
          >
            {loading ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              action.icon || <Trash2 className="mr-1.5 size-3.5" />
            )}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
