"use client";

import React, { useId } from "react";
import Select, { GroupBase, Props } from "react-select";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string | number;
  label: string;
}

export interface SearchableSelectProps
  extends Omit<Props<SearchableSelectOption, boolean, GroupBase<SearchableSelectOption>>, "value" | "onChange" | "options"> {
  options: (SearchableSelectOption | GroupBase<SearchableSelectOption>)[];
  value?: string | number | (string | number)[] | null;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  size?: "default" | "sm";
  error?: boolean;
}

export const SearchableSelect = ({
  options = [],
  value,
  onChange,
  name,
  placeholder = "Select...",
  disabled = false,
  required = false,
  className = "",
  size = "default",
  error = false,
  isMulti = false,
  isClearable = true,
  isSearchable = true,
  ...props
}: SearchableSelectProps) => {
  const instanceId = useId();

  // Flatten options if they are grouped, to easily find the selectedOption
  const flatOptions = React.useMemo(() => {
    const list: SearchableSelectOption[] = [];
    options.forEach((opt: any) => {
      if (opt && Array.isArray(opt.options)) {
        list.push(...opt.options);
      } else if (opt) {
        list.push(opt);
      }
    });
    return list;
  }, [options]);

  // Find corresponding option object(s) based on value prop (handles string/number/arrays)
  const selectedOption = React.useMemo(() => {
    if (value === undefined || value === null) return null;
    if (isMulti) {
      const valArray = Array.isArray(value) ? value : [value];
      return flatOptions.filter((opt) => valArray.map(String).includes(String(opt.value)));
    } else {
      return flatOptions.find((opt) => String(opt.value) === String(value)) || null;
    }
  }, [value, flatOptions, isMulti]);

  const handleSelectChange = (newValue: any) => {
    if (onChange) {
      let resolvedValue: any = "";
      if (isMulti) {
        resolvedValue = (newValue || []).map((val: any) => val.value);
      } else {
        resolvedValue = newValue ? newValue.value : "";
      }

      // Simulate a standard HTMLSelectElement ChangeEvent
      const syntheticEvent = {
        target: {
          name: name || "",
          value: resolvedValue,
        },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;

      onChange(syntheticEvent);
    }
  };

  return (
    <div className={cn("w-full text-left", className)}>
      <Select
        instanceId={instanceId}
        options={options}
        value={selectedOption}
        onChange={handleSelectChange}
        isDisabled={disabled}
        isClearable={isClearable}
        isSearchable={isSearchable}
        isMulti={isMulti}
        placeholder={placeholder}
        required={required}
        unstyled
        classNames={{
          control: ({ isFocused, isDisabled }) =>
            cn(
              "flex w-full items-center justify-between gap-1.5 rounded-xl border transition-all text-sm font-semibold text-gray-700 outline-none dark:bg-input/30 dark:text-foreground",
              size === "default" ? "min-h-[48px] px-4 py-1.5" : "min-h-[38px] px-3 py-1",
              isFocused
                ? "bg-white border-blue-500 ring-2 ring-blue-500/20 dark:border-ring dark:ring-ring/50"
                : "bg-slate-50/50 border-slate-200 dark:border-slate-800",
              error && "border-red-500 ring-2 ring-red-200 dark:border-destructive/50 dark:ring-destructive/40",
              isDisabled && "bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-input/80 dark:text-muted-foreground"
            ),
          valueContainer: () => "flex flex-wrap items-center gap-1.5 flex-1 min-w-0 overflow-hidden",
          singleValue: () => "truncate text-gray-900 dark:text-foreground",
          multiValue: () =>
            "bg-blue-50 border border-blue-100 text-blue-800 dark:bg-accent dark:border-border dark:text-foreground rounded-lg px-2 py-0.5 text-xs font-bold flex items-center gap-1.5",
          multiValueLabel: () => "truncate",
          multiValueRemove: () =>
            "hover:bg-blue-100 hover:text-blue-900 text-blue-400 cursor-pointer rounded-md p-0.5 dark:hover:bg-muted dark:text-muted-foreground",
          placeholder: () => "text-gray-400 dark:text-muted-foreground font-medium",
          input: () => "text-gray-900 dark:text-foreground",
          indicatorsContainer: () => "flex items-center gap-1.5 shrink-0",
          indicatorSeparator: () => "hidden",
          dropdownIndicator: () => "text-gray-400 hover:text-gray-600 dark:hover:text-foreground p-1 transition-colors",
          clearIndicator: () => "text-gray-400 hover:text-red-500 cursor-pointer p-1 transition-colors",
          menu: () =>
            "absolute z-[9999] mt-2 w-full rounded-2xl border border-gray-100 bg-white p-2 shadow-xl dark:border-border dark:bg-popover animate-slideDown origin-top",
          menuList: () => "max-h-60 overflow-y-auto space-y-1 pr-1",
          option: ({ isFocused, isSelected }) =>
            cn(
              "w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-all cursor-pointer select-none",
              isSelected
                ? "bg-blue-900 text-white dark:bg-primary dark:text-primary-foreground"
                : isFocused
                ? "bg-blue-50 text-blue-900 dark:bg-accent dark:text-accent-foreground"
                : "text-gray-700 hover:bg-gray-50 dark:text-foreground dark:hover:bg-input/30"
            ),
          noOptionsMessage: () => "text-gray-400 dark:text-muted-foreground text-sm font-medium py-3 text-center",
        }}
        {...props}
      />
    </div>
  );
};
