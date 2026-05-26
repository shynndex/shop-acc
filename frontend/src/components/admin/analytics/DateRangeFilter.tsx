import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

interface DateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onApply: () => void;
  loading?: boolean;
}

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onApply,
  loading,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Khoảng thời gian:</Label>
      </div>
      
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="w-[150px]"
          max={to}
        />
        <span className="text-muted-foreground">→</span>
        <Input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="w-[150px]"
          min={from}
          max={new Date().toISOString().split("T")[0]}
        />
      </div>
      
      <Button onClick={onApply} disabled={loading} size="sm">
        {loading ? "Đang tải..." : "Áp dụng"}
      </Button>
      
      {/* Quick presets */}
      <div className="flex items-center gap-1 ml-auto">
        <Button variant="ghost" size="sm" onClick={() => {
          const today = new Date().toISOString().split("T")[0];
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          onFromChange(weekAgo);
          onToChange(today);
          onApply();
        }}>
          7 ngày
        </Button>
        <Button variant="ghost" size="sm" onClick={() => {
          const today = new Date().toISOString().split("T")[0];
          const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          onFromChange(monthAgo);
          onToChange(today);
          onApply();
        }}>
          30 ngày
        </Button>
      </div>
    </div>
  );
}