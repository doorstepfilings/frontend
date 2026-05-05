"use client";

import React from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  error,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center px-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {error && (
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter animate-pulse">
            {error}
          </span>
        )}
      </div>
      <div className="relative group">{children}</div>
    </div>
  );
}
