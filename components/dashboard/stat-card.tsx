"use client";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: "blue" | "amber" | "emerald" | "indigo" | "rose" | "slate";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ label, value, icon, color, trend, className }: StatCardProps) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const progressMap = {
    blue: "bg-blue-900",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    indigo: "bg-indigo-500",
    rose: "bg-rose-500",
    slate: "bg-slate-700",
  };

  return (
    <div className={cn(
      "panel-card group relative overflow-hidden p-5 sm:p-6",
      className
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center gap-3">
             <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border", colorMap[color])}>
               <i className={cn("fas", icon, "text-sm")}></i>
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
          </div>
          
          <div className="flex flex-wrap items-baseline gap-3">
            <h4 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{value}</h4>
            {trend && (
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em]",
                trend.isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              )}>
                <i className={cn("fas", trend.isPositive ? "fa-arrow-up" : "fa-arrow-down", "text-[8px]")}></i>
                {trend.value}%
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn(
          "h-full rounded-full",
          progressMap[color]
        )} style={{ width: '40%' }} />
      </div>
    </div>
  );
}
