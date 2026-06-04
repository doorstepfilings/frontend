"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";

interface DynamicListProps<T> {
  title: string;
  description?: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  addLabel?: string;
  emptyMessage?: string;
  className?: string;
  showCount?: boolean;
}

export function DynamicList<T>({
  title,
  description,
  items,
  onAdd,
  onRemove,
  renderItem,
  addLabel = "Add Item",
  emptyMessage = "No items added yet.",
  className = "",
  showCount = true,
}: DynamicListProps<T>) {
  return (
    <div
      className={`space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {title}
          </label>
          {description ? (
            <p className="text-sm leading-6 text-slate-600">{description}</p>
          ) : null}
          {showCount ? (
            <p className="text-xs text-slate-400">
              {items.length} item{items.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {addLabel}
        </button>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {items.map((item, index) => (
            <div key={index} className="space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-rose-500 transition hover:bg-rose-500 hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
              </div>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {emptyMessage}
          </p>
        </div>
      )}
    </div>
  );
}
