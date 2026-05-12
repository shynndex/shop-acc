import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

export interface SearchBarProps {
  /** Giá trị mặc định */
  value?: string;
  /** Callback khi search value thay đổi (sau debounce) */
  onSearch: (value: string) => void;
  placeholder?: string;
  /** Debounce delay (ms) - default 300ms */
  debounceMs?: number;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  showClearButton?: boolean;
  icon?: React.ReactNode;
  autoFocus?: boolean;
}

const SearchBar = ({
  value = "",
  onSearch,
  placeholder = "Tìm kiếm",
  debounceMs = 300,
  loading = false,
  disabled = false,
  className,
  inputClassName,
  showClearButton = true,
  icon,
  autoFocus = false,
}: SearchBarProps) => {
  const [inputValue, setInputValue] = useState(value);

  // Debounced value
  const [debouncedValue] = useDebounce(inputValue, debounceMs);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (debouncedValue !== value) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, value, onSearch]);

  const handleClear = useCallback(() => {
    setInputValue("");
    onSearch("");
  }, [onSearch]);

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : icon ? (
          icon
        ) : (
          <Search className="size-4 text-muted-foreground" />
        )}
      </div>

      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pl-9 pr-9", inputClassName)}
        autoFocus={autoFocus}
      />

      {/* Clear Button */}
      {showClearButton && inputValue && !loading && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Xóa tìm kiếm"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
