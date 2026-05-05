"use client";

import React from "react";

interface ToggleCardProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  iconOn?: string;
  iconOff?: string;
}

export function ToggleCard({
  label,
  description,
  checked,
  onChange,
  iconOn = "fa-check",
  iconOff = "fa-plus",
}: ToggleCardProps) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`group p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md ${
        checked
          ? "bg-blue-600 border-blue-500 shadow-blue-200/50"
          : "bg-white border-slate-100 hover:border-blue-200"
      }`}
    >
      <div>
        <h4
          className={`text-lg font-black tracking-tight mb-1 transition-colors ${
            checked ? "text-white" : "text-slate-900 group-hover:text-blue-600"
          }`}
        >
          {label}
        </h4>
        {description && (
          <p
            className={`text-[10px] font-bold uppercase tracking-widest opacity-60 transition-colors ${
              checked ? "text-blue-50" : "text-slate-400"
            }`}
          >
            {description}
          </p>
        )}
      </div>
      <div
        className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
          checked
            ? "bg-white text-blue-600 rotate-180"
            : "bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600"
        }`}
      >
        <i className={`fas ${checked ? iconOn : iconOff}`}></i>
      </div>
    </div>
  );
}
