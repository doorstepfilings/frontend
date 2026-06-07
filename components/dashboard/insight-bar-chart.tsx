"use client";

import { cn } from "@/lib/utils";

export type InsightBarChartTone =
  | "blue"
  | "amber"
  | "emerald"
  | "indigo"
  | "rose"
  | "slate";

export type InsightBarChartDatum = {
  label: string;
  value: number;
  tone?: InsightBarChartTone;
  helper?: string;
};

interface InsightBarChartProps {
  title: string;
  subtitle?: string;
  totalLabel?: string;
  totalValue?: number;
  emptyLabel?: string;
  data: InsightBarChartDatum[];
  className?: string;
}

const toneMap: Record<
  InsightBarChartTone,
  { badge: string; bar: string; dot: string }
> = {
  blue: {
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    bar: "bg-blue-900",
    dot: "bg-blue-500",
  },
  amber: {
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
  },
  emerald: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  indigo: {
    badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
    bar: "bg-indigo-500",
    dot: "bg-indigo-500",
  },
  rose: {
    badge: "bg-rose-50 text-rose-700 border-rose-100",
    bar: "bg-rose-500",
    dot: "bg-rose-500",
  },
  slate: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    bar: "bg-slate-700",
    dot: "bg-slate-500",
  },
};

export function InsightBarChart({
  title,
  subtitle,
  totalLabel = "Total",
  totalValue,
  emptyLabel = "No chart data available right now.",
  data,
  className,
}: InsightBarChartProps) {
  const sanitizedData = data
    .map((item) => ({
      ...item,
      tone: item.tone ?? "slate",
      value: Number.isFinite(item.value) ? Math.max(item.value, 0) : 0,
    }))
    .filter((item) => item.value > 0);
  const total = totalValue ?? sanitizedData.reduce((sum, item) => sum + item.value, 0);
  const maxValue = sanitizedData.reduce(
    (highest, item) => Math.max(highest, item.value),
    1,
  );

  return (
    <div className={cn("panel-card p-5 sm:p-6", className)}>
      <div className="panel-section-header">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        <span className="panel-chip">{sanitizedData.length} segments</span>
      </div>

      {sanitizedData.length === 0 ? (
        <div className="panel-empty-state mt-5 px-5 py-14 text-center text-sm font-medium">
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-[13rem_minmax(0,1fr)]">
          <div className="space-y-4">
            {sanitizedData.map((item) => {
              const tone = toneMap[item.tone];
              const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
              const width = `${Math.max((item.value / maxValue) * 100, 8)}%`;

              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={cn("h-2.5 w-2.5 rounded-full", tone.dot)} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {item.label}
                        </p>
                        {item.helper ? (
                          <p className="text-[11px] font-medium text-slate-500">
                            {item.helper}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                          tone.badge,
                        )}
                      >
                        {percentage}%
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {item.value}
                      </span>
                    </div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", tone.bar)}
                      style={{ width }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
