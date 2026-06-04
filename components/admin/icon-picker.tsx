"use client";

import {
  DEFAULT_ICON_NAME,
  getIconMeta,
  useIconSearch,
} from "@/hooks/use-icon-search";
import { SearchSelect } from "@/components/ui/core/search-select";
import { ReactIcon } from "@/components/ui/react-icon";

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const { results } = useIconSearch("");
  const selectedValue = value.trim() || DEFAULT_ICON_NAME;
  const selectedIcon = getIconMeta(selectedValue);

  return (
    <SearchSelect
      options={results}
      value={selectedValue}
      onChange={onChange}
      placeholder="Select category icon"
      searchPlaceholder="Search icon by name, use case, or industry..."
      emptyStateMessage="No icons match your search."
      emptyStateHint="Try terms like business, legal, invoice, finance, or government."
      renderValueStart={(option) => {
        const activeIcon = option ?? selectedIcon;

        return (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] bg-[linear-gradient(135deg,#1d4ed8,#2563eb)] text-white shadow-[0_16px_30px_-20px_rgba(37,99,235,0.9)]">
            <ReactIcon iconName={activeIcon.value} size={18} />
          </span>
        );
      }}
      renderOptionStart={(option, state) => (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            state.selected
              ? "bg-blue-600 text-white"
              : state.active
                ? "bg-slate-200 text-slate-700"
                : "bg-slate-100 text-slate-500"
          }`}
        >
          <ReactIcon iconName={option.value} size={16} />
        </span>
      )}
    />
  );
}
