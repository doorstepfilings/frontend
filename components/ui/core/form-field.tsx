"use client";

import React from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 px-1">
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {hint ? (
            <p className="text-xs leading-5 text-slate-500">{hint}</p>
          ) : null}
        </div>
        {error && (
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-500">
            {error}
          </span>
        )}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
