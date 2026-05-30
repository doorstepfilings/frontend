"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  CRM_STAGE_META,
  formatCurrency,
  getCrmCustomerTypeLabel,
  getCrmPaymentStatusLabel,
  getCrmQuotationStatusLabel,
  getCrmStageLabel,
} from "@/lib/constants/crm";

export function CrmPanel({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">
            {title}
          </h3>
        </div>
        {action}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

export function CrmStatCard({
  label,
  value,
  helper,
  icon,
  tone = "slate",
}: {
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone?: "slate" | "sky" | "emerald" | "violet";
}) {
  const toneClasses = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };

  return (
    <div className={`rounded-[1.75rem] border p-5 ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
          <p className="mt-2 text-sm font-medium opacity-80">{helper}</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70">
          <i className={`fas ${icon}`} />
        </span>
      </div>
    </div>
  );
}

export function CrmBadge({
  stage,
  paymentStatus,
  quotationStatus,
}: {
  stage?: string | null;
  paymentStatus?: string | null;
  quotationStatus?: string | null;
}) {
  if (stage) {
    const stageKey = stage in CRM_STAGE_META ? (stage as keyof typeof CRM_STAGE_META) : "new_inquiry";
    const meta = CRM_STAGE_META[stageKey];

    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${meta.badge}`}
      >
        <i className={`fas ${meta.icon} text-[10px]`} />
        {getCrmStageLabel(stage)}
      </span>
    );
  }

  if (paymentStatus) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
        <i className="fas fa-wallet text-[10px]" />
        {getCrmPaymentStatusLabel(paymentStatus)}
      </span>
    );
  }

  if (quotationStatus) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">
        <i className="fas fa-file-invoice-dollar text-[10px]" />
        {getCrmQuotationStatusLabel(quotationStatus)}
      </span>
    );
  }

  return null;
}

export function CrmKeyValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value || "-"}</p>
    </div>
  );
}

export function CrmEmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
        <i className={`fas ${icon}`} />
      </div>
      <p className="mt-4 text-base font-bold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export function CrmInlineField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "date";
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
      />
    </div>
  );
}

export function CrmInlineSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CrmInlineTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
      />
    </div>
  );
}

export function CrmSubmitButton({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      loading={loading}
      onClick={onClick}
      className="h-11 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-sky-700"
    >
      {label}
    </Button>
  );
}

export function formatCrmSummaryValue(
  label: string,
  value: string,
  kind?: "customer_type" | "stage" | "payment" | "quotation" | "currency",
) {
  if (kind === "customer_type") {
    return getCrmCustomerTypeLabel(value);
  }

  if (kind === "stage") {
    return getCrmStageLabel(value);
  }

  if (kind === "payment") {
    return getCrmPaymentStatusLabel(value);
  }

  if (kind === "quotation") {
    return getCrmQuotationStatusLabel(value);
  }

  if (kind === "currency") {
    return formatCurrency(value);
  }

  return value || label;
}
