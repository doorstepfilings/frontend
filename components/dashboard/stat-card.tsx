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
    blue: "from-blue-500 to-blue-600 shadow-blue-500/20",
    amber: "from-amber-500 to-amber-600 shadow-amber-500/20",
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-500/20",
    indigo: "from-indigo-500 to-indigo-600 shadow-indigo-500/20",
    rose: "from-rose-500 to-rose-600 shadow-rose-500/20",
    slate: "from-slate-700 to-slate-800 shadow-slate-700/20",
  };

  const bgIconMap = {
    blue: "bg-blue-400/20",
    amber: "bg-amber-400/20",
    emerald: "bg-emerald-400/20",
    indigo: "bg-indigo-400/20",
    rose: "bg-rose-400/20",
    slate: "bg-slate-400/20",
  };

  return (
    <div className={cn(
      "relative overflow-hidden bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 group hover:shadow-xl transition-all duration-500",
      className
    )}>
      {/* Background Accent */}
      <div className={cn(
        "absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 rounded-full bg-gradient-to-br",
        colorMap[color]
      )} />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className={cn("p-2.5 rounded-xl flex items-center justify-center", bgIconMap[color])}>
               <i className={cn("fas", icon, "text-sm", {
                 "text-blue-600": color === "blue",
                 "text-amber-600": color === "amber",
                 "text-emerald-600": color === "emerald",
                 "text-indigo-600": color === "indigo",
                 "text-rose-600": color === "rose",
                 "text-slate-600": color === "slate",
               })}></i>
             </div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
          </div>
          
          <div className="flex items-baseline gap-3">
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
            {trend && (
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1",
                trend.isPositive ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
              )}>
                <i className={cn("fas", trend.isPositive ? "fa-arrow-up" : "fa-arrow-down", "text-[8px]")}></i>
                {trend.value}%
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
        <div className={cn(
          "h-full rounded-full bg-gradient-to-r",
          colorMap[color]
        )} style={{ width: '40%' }} />
      </div>
    </div>
  );
}
