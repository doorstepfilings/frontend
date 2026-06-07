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
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-1 px-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {error && (
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter animate-pulse">
              {error}
            </span>
          )}
        </div>
        {hint && !error && (
          <p className="text-[11px] font-medium text-slate-400 leading-normal mt-0.5">
            {hint}
          </p>
        )}
      </div>
      <div className="relative group">{children}</div>
    </div>
  );
}
