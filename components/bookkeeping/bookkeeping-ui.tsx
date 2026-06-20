import Link from "next/link";
import type { ReactNode } from "react";
import { formatCurrency } from "@/lib/features/bookkeeping/helpers";
import type { DocumentStatus } from "@/lib/features/bookkeeping/types";

export const inputClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10";

export const textareaClass =
  "min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10";

export const selectClass = inputClass;

export function BookkeepingPageHeader({
  title,
  description,
  actionHref,
  actionLabel,
  icon = "fa-plus",
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: string;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
          Bookkeeping
        </p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
        >
          <i className={`fas ${icon}`} />
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  icon: string;
  tone?: "blue" | "emerald" | "amber" | "rose" | "slate";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
          <i className={`fas ${icon}`} />
        </span>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <i className="fas fa-folder-open" />
      </div>
      <h2 className="mt-4 text-lg font-black text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 text-sm font-black text-white hover:bg-blue-800"
        >
          <i className="fas fa-plus" />
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const tone =
    status === "paid" || status === "accepted"
      ? "bg-emerald-50 text-emerald-700"
      : status === "overdue" || status === "rejected" || status === "cancelled"
        ? "bg-rose-50 text-rose-700"
        : status === "sent" || status === "partial"
          ? "bg-amber-50 text-amber-700"
          : status === "converted"
            ? "bg-indigo-50 text-indigo-700"
            : "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ${tone}`}>
      {status.replace("-", " ")}
    </span>
  );
}

export function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
      {label}
      {required ? <span className="text-rose-500"> *</span> : null}
    </label>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function AmountCell({ value }: { value: number }) {
  return <span className="font-black text-slate-950">{formatCurrency(value)}</span>;
}
