import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CommandGroup } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface FilterDropdownProps {
  /** Options để chọn */
  options: FilterOption[];
  /** Giá trị đang chọn (single) */
  value?: string;
  /** Giá trị đang chọn (multiple) */
  values?: string[];
  /** Callback khi chọn (single) */
  onChange?: (value: string) => void;
  /** Callback khi chọn (multiple) */
  onValuesChange?: (values: string[]) => void;
  /** Cho phép chọn nhiều giá trị */
  multiple?: boolean;
  placeholder?: string;
  /** Search placeholder trong dropdown */
  searchPlaceholder?: string;
  label?: string;
  disabled?: boolean;
  /** Show count badge */
  showCount?: boolean;
  className?: string;
  buttonClassName?: string;
  contentClassName?: string;
  clearable?: boolean;
  searchable?: boolean;
  /** Max height của dropdown content */
  maxHeight?: string;
}

const FilterDropdown = ({
  options,
  value,
  values,
  onChange,
  onValuesChange,
  multiple = false,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm kiếm...",
  label,
  disabled = false,
  showCount = true,
  className,
  buttonClassName,
  contentClassName,
  clearable = true,
  searchable = true,
  maxHeight = "300px",
}: FilterDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // tránh filter lại mỗi lần component render(except khi searchValue thay đổi)
  const filteredOptions = useMemo(() => {
    if (!searchValue) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [searchValue, options]);

  const selectedLabels = useMemo(() => {
    if (multiple) {
      return (values || [])
        .map((v) => options.find((o) => o.value === v)?.label)
        .filter(Boolean);
    }

    const singleLabel = options.find((o) => o.value === value)?.label;
    return singleLabel ? [singleLabel] : [];
  }, [multiple, values, value, options]);

  const handleSelect = useCallback(
    (selectedValue: string) => {
      if (multiple) {
        const currentValues = values || [];
        const newValues = currentValues.includes(selectedValue)
          ? currentValues.filter((v) => v !== selectedValue)
          : [...currentValues, selectedValue];
        onValuesChange?.(newValues);
      } else {
        onChange?.(selectedValue === value ? "" : selectedValue);
        setOpen(false);
      }
    },
    [multiple, values, onValuesChange, onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (multiple) {
        onValuesChange?.([]);
      } else {
        onChange?.("");
        setOpen(false);
      }
    },
    [multiple, onValuesChange, onChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          role="combobox"
          aria-expanded={open}
          aria-label={label || placeholder}
          disabled={disabled}
          className={cn("w-full justify-between", buttonClassName)}
        >
          <span
            className={cn(
              "truncate",
              selectedLabels?.length ? "" : "text-muted-foreground",
            )}
          >
            {selectedLabels?.length ? selectedLabels.join(", ") : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[--radix-popover-trigger-width] p-0",
          contentClassName,
        )}
        align="start"
        style={{ maxHeight }}
      >
        <Command shouldFilter={false}>
          {searchable && (
            <>
              <CommandInput
                placeholder={searchPlaceholder}
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>Không tìm thấy kết quả</CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                      disabled={option.disabled}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {option.icon && (
                            <span className="flex-shrink-0">{option.icon}</span>
                          )}
                          <span className="flex-1">{option.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {showCount && option.count !== undefined && (
                            <Badge variant={"secondary"} className="text-xs">
                              {option.count}
                            </Badge>
                          )}
                          {multiple ? (
                            <Check
                              className={cn(
                                "size-4",
                                values?.includes(option.value)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                          ) : (
                            <Check
                              className={cn(
                                "h-4 w-4",
                                value === option.value
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </>
          )}

          {!searchable && (
            <CommandList style={{ maxHeight: "calc(300px-40px)" }}>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    disabled={option.disabled}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {option.icon && (
                          <span className="flex-shrink-0">{option.icon}</span>
                        )}
                        <span className="flex-1">{option.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {showCount && option.count !== undefined && (
                          <Badge variant={"secondary"} className="text-xs">
                            {option.count}
                          </Badge>
                        )}
                        {multiple ? (
                          <Check
                            className={cn(
                              "size-4",
                              values?.includes(option.value)
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        ) : (
                          <Check
                            className={cn(
                              "h-4 w-4",
                              value === option.value
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          )}

          {clearable && (multiple ? (values?.length || 0) > 0 : value) && (
            <>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={handleClear}
                  className="justify-center text-center text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  Xóa bộ lọc
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default FilterDropdown;
