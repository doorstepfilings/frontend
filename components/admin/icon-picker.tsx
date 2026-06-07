"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, HelpCircle } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getStoredCategoryIconLabel } from "@/lib/icons/category-icons";
import dynamicIconImports from "lucide-react/dynamicIconImports";

// Legacy FA icons kept for backward compat with stored values
const FAMILIAR_FA_ICONS = [
  "fa-briefcase", "fa-file-invoice", "fa-landmark", "fa-user-tie",
  "fa-building", "fa-shield-halved", "fa-calculator", "fa-stamp",
  "fa-balance-scale", "fa-chart-pie", "fa-hand-holding-dollar", "fa-file-contract",
  "fa-gavel", "fa-globe", "fa-users-gear", "fa-file-shield"
];

// Curated real-life business & professional services icons (shown by default)
const BUSINESS_DEFAULT_ICONS = [
  // Invoicing & Finance
  "lucide:receipt",
  "lucide:receipt-indian-rupee",
  "lucide:credit-card",
  "lucide:banknote",
  "lucide:wallet",
  "lucide:coins",
  "lucide:indian-rupee",
  "lucide:percent",
  // Tax & Accounting
  "lucide:calculator",
  "lucide:file-spreadsheet",
  "lucide:file-text",
  "lucide:file-check-2",
  "lucide:book-open",
  "lucide:book-marked",
  "lucide:clipboard-list",
  "lucide:chart-bar",
  // Company & Registration
  "lucide:building-2",
  "lucide:landmark",
  "lucide:briefcase",
  "lucide:store",
  "lucide:factory",
  "lucide:handshake",
  "lucide:badge-check",
  "lucide:stamp",
  // Legal & Compliance
  "lucide:scale",
  "lucide:gavel",
  "lucide:shield-check",
  "lucide:shield-alert",
  "lucide:lock-keyhole",
  "lucide:file-lock-2",
  "lucide:file-signature",
  "lucide:scroll-text",
  // HR & People
  "lucide:users",
  "lucide:user-check",
  "lucide:user-cog",
  "lucide:id-card",
  "lucide:contact",
  "lucide:hard-hat",
  // Growth & Analytics
  "lucide:trending-up",
  "lucide:bar-chart-2",
  "lucide:pie-chart",
  "lucide:target",
  // International & Government
  "lucide:globe",
  "lucide:plane",
  "lucide:ship",
  "lucide:award",
  "lucide:flag",
  "lucide:mail",
  "lucide:package",
  "lucide:truck",
];

const LUCIDE_ICON_NAMES = Object.keys(dynamicIconImports);

export function IconPicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter logic
  const filteredMatches = useMemo(() => {
    const query = search.toLowerCase().trim().replace(/\s+/g, "-");
    
    // Default list when search query is empty — show curated business icons
    if (!query) {
      return BUSINESS_DEFAULT_ICONS;
    }

    const matchingFA = FAMILIAR_FA_ICONS.filter((icon) => {
      const cleanName = icon.replace(/^fa-/, "");
      return cleanName.includes(query);
    });

    const matchingLucide = LUCIDE_ICON_NAMES.filter((name) =>
      name.includes(query)
    ).map((name) => `lucide:${name}`);

    // Combine and limit to first 36 results for quick rendering and best responsiveness
    return [...matchingFA, ...matchingLucide].slice(0, 36);
  }, [search]);

  // Reset highlight index when matches change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlightedIndex(0);
  }, [filteredMatches]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && isOpen && filteredMatches.length > 0) {
      const activeElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeElement) {
        const listContainer = listRef.current;
        const elemTop = activeElement.offsetTop;
        const elemBottom = elemTop + activeElement.offsetHeight;
        const containerTop = listContainer.scrollTop;
        const containerBottom = containerTop + listContainer.clientHeight;

        if (elemTop < containerTop) {
          listContainer.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          listContainer.scrollTop = elemBottom - listContainer.clientHeight;
        }
      }
    }
  }, [highlightedIndex, isOpen, filteredMatches]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredMatches.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + filteredMatches.length) % filteredMatches.length);
        break;
      case "Enter":
        e.preventDefault();
        if (filteredMatches[highlightedIndex]) {
          onChange(filteredMatches[highlightedIndex]);
          setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative space-y-4 w-full">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search 1,000+ category icons (e.g. tax, wallet, card)..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full h-12 pl-11 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-105"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setIsOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown Overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-950 animate-slideDown">
          <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-850 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>{search ? "Search Suggestions" : "Popular Icons"}</span>
            <span>{filteredMatches.length} available</span>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <HelpCircle className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-500">No icons match &quot;{search}&quot;</p>
              <p className="text-[10px] text-slate-400 mt-1">Try terms like tax, invoice, card, building</p>
            </div>
          ) : (
            <div 
              ref={listRef} 
              className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-0.5 scrollbar-thin"
            >
              {filteredMatches.map((icon, index) => {
                const isSelected = value === icon;
                const isHighlighted = highlightedIndex === index;
                const label = getStoredCategoryIconLabel(icon);

                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => {
                      onChange(icon);
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400"
                        : isHighlighted
                        ? "border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        : "border-slate-100 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-all ${
                      isSelected 
                        ? "bg-blue-100 text-blue-750 dark:bg-blue-900/50 dark:text-blue-400" 
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      <CategoryIcon icon={icon} className="text-base" />
                    </div>
                    <span className="text-xs font-semibold tracking-tight truncate pr-1">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}


    </div>
  );
}
