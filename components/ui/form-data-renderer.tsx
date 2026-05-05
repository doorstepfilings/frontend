"use client";

import React from "react";

interface FormDataRendererProps {
  formData: Record<string, any>;
  title?: string;
  icon?: string;
}

export function FormDataRenderer({ 
  formData, 
  title = "Application Details", 
  icon = "fa-file-alt" 
}: FormDataRendererProps) {
  if (!formData || Object.keys(formData).length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-8 flex items-center gap-2">
        <i className={`fas ${icon} text-blue-600`} />
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        {Object.entries(formData).map(([key, value]) => {
          if (typeof value === "object" || value === null || !value) return null;
          return (
            <div key={key} className="group border-b border-slate-50 pb-4 last:border-0 last:pb-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {key.replace(/_/g, " ")}
              </p>
              <p className="text-sm font-semibold text-slate-900 leading-tight">{String(value)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
