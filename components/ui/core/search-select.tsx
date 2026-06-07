"use client";

import React from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";

export type SearchSelectOption = {
  value: string;
  label: string;
};

interface SearchSelectProps {
  options: SearchSelectOption[];
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  required?: boolean;
  triggerClassName?: string;
  valueLabelClassName?: string;
  handleClassName?: string;
  treatEmptyValueAsPlaceholder?: boolean;
  renderValueStart?: (option: any) => React.ReactNode;
  selectStyle?: React.CSSProperties;
  size?: "default" | "sm";
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  searchable,
  required,
  triggerClassName,
  valueLabelClassName,
  handleClassName,
  treatEmptyValueAsPlaceholder,
  renderValueStart,
  selectStyle,
  size = "default",
}: SearchSelectProps) {
  return (
    <SearchableSelect
      options={options}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      isSearchable={searchable}
      required={required}
      size={size}
      className={triggerClassName}
      isClearable={false}
    />
  );
}
