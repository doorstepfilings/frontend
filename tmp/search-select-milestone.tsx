"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import clsx from "clsx";
import Select from "react-dropdown-select";
import type { SelectProps, SelectRenderer } from "react-dropdown-select";
import { FaCheck, FaChevronDown, FaMagnifyingGlass } from "react-icons/fa6";

export type SearchSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
  keywords?: string[];
};

type SearchSelectProps<T extends SearchSelectOption> = {
  options: T[];
  value: number | string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyStateMessage?: string;
  emptyStateHint?: string;
  disabled?: boolean;
  searchable?: boolean;
  name?: string;
  required?: boolean;
  onBlur?: () => void;
  treatEmptyValueAsPlaceholder?: boolean;
  selectStyle?: CSSProperties;
  triggerClassName?: string;
  valueLabelClassName?: string;
  handleClassName?: string;
  dropdownClassName?: string;
  dropdownListClassName?: string;
  optionClassName?: string;
  searchInputClassName?: string;
  renderValueStart?: (option: T | null) => ReactNode;
  renderOptionStart?: (
    option: T,
    state: { active: boolean; selected: boolean },
  ) => ReactNode;
};

type DropdownState<T> = SelectRenderer<T>["state"] & {
  cursor: number | null;
  activeCursorItem?: number | null;
  searchResults?: T[];
};

function getSearchTokens<T extends SearchSelectOption>(option: T) {
  return Array.from(
    new Set(
      [option.label, option.value, ...(option.keywords ?? [])]
        .join(" ")
        .toLowerCase()
        .split(/[\s/-]+/)
        .map((token) => token.trim())
        .filter(Boolean),
    ),
  );
}

function groupSearchResults<T extends SearchSelectOption>(options: T[]) {
  const groups: Array<{ label: string | null; options: T[] }> = [];
  const indexByLabel = new Map<string, number>();

  for (const option of options) {
    const groupLabel = option.group?.trim() || "";
    const lookupKey = groupLabel || "__ungrouped__";
    const existingIndex = indexByLabel.get(lookupKey);

    if (existingIndex === undefined) {
      indexByLabel.set(lookupKey, groups.length);
      groups.push({
        label: groupLabel || null,
        options: [option],
      });
      continue;
    }

    groups[existingIndex].options.push(option);
  }

  return groups;
}

function hasScrollableOverflow(style: CSSStyleDeclaration) {
  return [style.overflow, style.overflowX, style.overflowY].some((value) =>
    /(auto|scroll|overlay)/.test(value),
  );
}

function getScrollableAncestors(element: HTMLElement | null) {
  const ancestors: HTMLElement[] = [];

  if (typeof window === "undefined") {
    return ancestors;
  }

  let current = element?.parentElement ?? null;

  while (current && current !== document.body) {
    if (hasScrollableOverflow(window.getComputedStyle(current))) {
      ancestors.push(current);
    }

    current = current.parentElement;
  }

  return ancestors;
}

export function SearchSelect<T extends SearchSelectOption>({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyStateMessage = "No matching options found.",
  emptyStateHint,
  disabled = false,
  searchable = false,
  name,
  required = false,
  onBlur,
  treatEmptyValueAsPlaceholder = false,
  selectStyle,
  triggerClassName,
  valueLabelClassName,
  handleClassName,
  dropdownClassName,
  dropdownListClassName,
  optionClassName,
  searchInputClassName,
  renderValueStart,
  renderOptionStart,
}: SearchSelectProps<T>) {
  const selectShellRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const normalizedValue = String(value ?? "");
  const portalRoot =
    typeof document === "undefined" ? undefined : document.body;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === normalizedValue) ?? null,
    [normalizedValue, options],
  );
  const hasFormValue = selectedOption
    ? !treatEmptyValueAsPlaceholder || selectedOption.value !== ""
    : false;
  const formValue = hasFormValue ? String(selectedOption?.value ?? "") : "";

  const selectedValues = selectedOption ? [selectedOption] : [];

  const handleChange = (values: T[]) => {
    const nextOption = values[0];

    if (nextOption) {
      onChange(String(nextOption.value));
    }
  };

  const searchFn = ({ state }: SelectRenderer<T>) => {
    const normalized = state.search.trim().toLowerCase();

    if (!normalized) {
      return options;
    }

    return options.filter((option) =>
      getSearchTokens(option).some((token) => token.includes(normalized)),
    );
  };

  const focusSearchInput = () => {
    if (!searchable) {
      return;
    }

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
  };

  useEffect(() => {
    if (!isDropdownOpen || !portalRoot) {
      return;
    }

    const scrollableAncestors = getScrollableAncestors(selectShellRef.current);
    let frameId: number | null = null;

    const syncDropdownPosition = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        window.dispatchEvent(new Event("scroll"));
      });
    };

    syncDropdownPosition();

    for (const ancestor of scrollableAncestors) {
      ancestor.addEventListener("scroll", syncDropdownPosition, { passive: true });
    }

    window.visualViewport?.addEventListener("resize", syncDropdownPosition);
    window.visualViewport?.addEventListener("scroll", syncDropdownPosition);

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      for (const ancestor of scrollableAncestors) {
        ancestor.removeEventListener("scroll", syncDropdownPosition);
      }

      window.visualViewport?.removeEventListener("resize", syncDropdownPosition);
      window.visualViewport?.removeEventListener("scroll", syncDropdownPosition);
    };
  }, [isDropdownOpen, portalRoot]);

  return (
    <div ref={selectShellRef} className="relative w-full">
      <Select<T>
        options={options}
        values={selectedValues}
        multi={false}
        disabled={disabled}
        searchable={false}
        dropdownHandle
        separator={false}
        keepSelectedInList
        closeOnSelect={false}
        clearOnBlur
        clearOnSelect
        dropdownGap={10}
        dropdownHeight="20rem"
        dropdownPosition="auto"
        labelField="label"
        valueField="value"
        color="#2563eb"
        portal={portalRoot}
        searchFn={searchFn}
        onChange={handleChange}
        onDropdownOpen={() => {
          setIsDropdownOpen(true);
          focusSearchInput();
        }}
        onDropdownClose={() => {
          setIsDropdownOpen(false);
          onBlur?.();
        }}
        className="text-slate-900"
        style={{
          borderColor: "#e2e8f0",
          borderRadius: "1.5rem",
          background: "#ffffff",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
          minHeight: "auto",
          padding: 0,
          ...selectStyle,
        }}
        contentRenderer={({ props, state }: SelectRenderer<T>) => {
          const currentOption = state.values[0] ?? selectedOption;
          const hasValue = currentOption
            ? !treatEmptyValueAsPlaceholder || currentOption.value !== ""
            : false;

          return (
            <div
              className={clsx(
                "flex min-h-[3rem] flex-1 items-center gap-3 px-4 py-3",
                props.disabled && "cursor-not-allowed opacity-70",
                triggerClassName,
              )}
            >
              {renderValueStart ? renderValueStart(currentOption ?? null) : null}
              <div className="min-w-0 flex-1">
                <p
                  title={currentOption?.label ?? placeholder}
                  className={clsx(
                    "truncate text-sm font-semibold",
                    hasValue ? "text-slate-900" : "text-slate-400",
                    valueLabelClassName,
                  )}
                >
                  {currentOption?.label ?? placeholder}
                </p>
              </div>
            </div>
          );
        }}
        dropdownHandleRenderer={({ state }: SelectRenderer<T>) => (
          <span
            className={clsx(
              "mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500",
              handleClassName,
            )}
          >
            <FaChevronDown
              size={12}
              className={clsx("transition", state.dropdown && "rotate-180")}
            />
          </span>
        )}
        dropdownRenderer={({ props, state, methods }: SelectRenderer<T>) => {
          const typedState = state as DropdownState<T>;
          const searchResults = typedState.searchResults ?? props.options;
          const groupedResults = groupSearchResults(searchResults);

          return (
            <div
              className={clsx(
                "react-dropdown-select-dropdown relative overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-[0_26px_60px_-28px_rgba(15,23,42,0.38)]",
                dropdownClassName,
              )}
            >
              {searchable ? (
                <div className="border-b border-slate-200 px-3 py-3">
                  <div className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 px-4">
                    <FaMagnifyingGlass
                      size={12}
                      className="shrink-0 text-slate-400"
                    />
                    <input
                      ref={searchInputRef}
                      value={state.search}
                      onChange={methods.setSearch}
                      onKeyDown={methods.handleKeyDown}
                      placeholder={searchPlaceholder}
                      className={clsx(
                        "h-11 min-w-0 flex-1 appearance-none border-0 bg-transparent px-0 pr-1 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 focus:outline-none focus:ring-0",
                        searchInputClassName,
                      )}
                    />
                  </div>
                </div>
              ) : null}

              {searchResults.length > 0 ? (
                <div className={clsx("max-h-[20rem] overflow-y-auto p-2", dropdownListClassName)}>
                  {groupedResults.map((group) => (
                    <div key={group.label ?? "__ungrouped__"} className="space-y-1">
                      {group.label ? (
                        <div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          {group.label}
                        </div>
                      ) : null}

                      {group.options.map((option) => {
                        const optionIndex = searchResults.findIndex(
                          (entry) => entry.value === option.value,
                        );
                        const selected = methods.isSelected(option);
                        const active =
                          typedState.activeCursorItem === optionIndex ||
                          typedState.cursor === optionIndex;

                        return (
                          <button
                            key={`${group.label ?? "option"}-${option.value}`}
                            type="button"
                            onClick={() => methods.addItem(option)}
                            onMouseEnter={() => methods.activeCursorItem(optionIndex)}
                            disabled={option.disabled}
                            className={clsx(
                              "flex w-full items-center gap-3 rounded-[1.15rem] border px-3 py-3 text-left transition",
                              selected
                                ? "border-blue-200 bg-blue-50/90"
                                : active
                                  ? "border-slate-300 bg-slate-50"
                                  : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50",
                              option.disabled && "cursor-not-allowed opacity-50",
                              optionClassName,
                            )}
                          >
                            {renderOptionStart ? renderOptionStart(option, { active, selected }) : null}

                            <span className="min-w-0 flex-1 whitespace-normal break-words text-sm font-semibold leading-5 text-slate-800">
                              {option.label}
                            </span>

                            <span
                              className={clsx(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px]",
                                selected
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-300",
                              )}
                            >
                              <FaCheck size={10} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    {emptyStateMessage}
                  </p>
                  {emptyStateHint ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {emptyStateHint}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          );
        }}
        additionalProps={{
          "aria-label": placeholder,
        } as SelectProps<T>["additionalProps"]}
      />

      {name || required ? (
        <input
          aria-hidden="true"
          className="sr-only"
          name={name}
          onChange={() => {}}
          readOnly
          required={required}
          tabIndex={-1}
          value={formValue}
        />
      ) : null}
    </div>
  );
}
