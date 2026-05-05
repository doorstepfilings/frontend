"use client";

import React from "react";

interface DynamicListProps<T> {
  title: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  addLabel?: string;
  emptyMessage?: string;
}

export function DynamicList<T>({
  title,
  items,
  onAdd,
  onRemove,
  renderItem,
  addLabel = "Add Item",
  emptyMessage = "No items added yet.",
}: DynamicListProps<T>) {
  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-10">
      <div className="flex items-center justify-between px-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {title}
        </label>
        <button
          type="button"
          onClick={onAdd}
          className="h-10 px-6 bg-slate-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
        >
          + {addLabel}
        </button>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {items.map((item, index) => (
            <div key={index} className="relative group">
              {renderItem(item, index)}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-6 right-6 h-10 w-10 bg-white text-rose-400 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white shadow-md border border-slate-100"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center border-2 border-dashed border-slate-50 rounded-[2.5rem]">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
            {emptyMessage}
          </p>
        </div>
      )}
    </div>
  );
}
