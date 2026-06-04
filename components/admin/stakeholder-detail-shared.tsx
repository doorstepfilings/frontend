"use client";

import type { ReactNode } from "react";
import { format, isValid } from "date-fns";
import type { AdminRecord } from "@/lib/admin/record-helpers";
import { PanelLogoLoader } from "@/components/ui/logo-loader";

export function formatAdminDate(
  value: Date | string | number | null | undefined,
  pattern = "dd MMM yyyy",
) {
  if (!value) {
    return "Unknown";
  }

  const resolvedDate = value instanceof Date ? value : new Date(value);
  return isValid(resolvedDate) ? format(resolvedDate, pattern) : "Unknown";
}

export function formatAdminCurrency(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "Rs 0";
  }

  return `Rs ${Math.round(amount).toLocaleString("en-IN")}`;
}

export function getRoleDisplayLabel(role: string | null | undefined) {
  if (role === "super_admin") {
    return "Super Admin";
  }

  if (role === "regional_manager") {
    return "Relationship Manager";
  }

  if (role === "accountant") {
    return "Accountant";
  }

  if (role === "admin") {
    return "Admin";
  }

  return "User";
}

export function getLocationDisplay(record: AdminRecord | null | undefined) {
  const district = typeof record?.district === "string" ? record.district : "";
  const city = typeof record?.city === "string" ? record.city : "";
  const state = typeof record?.state === "string" ? record.state : "";
  const pincode = typeof record?.pincode === "string" ? record.pincode : "";
  const primaryArea = district || city;

  if (primaryArea && state && pincode) {
    return `${primaryArea}, ${state} ${pincode}`;
  }

  if (primaryArea && state) {
    return `${primaryArea}, ${state}`;
  }

  if (primaryArea || state || pincode) {
    return primaryArea || state || pincode;
  }

  return "Not set";
}

export function LoadingState({ label }: { label: string }) {
  return (
    <PanelLogoLoader
      className="panel-page min-h-[24rem]"
      label={label}
      size={64}
      surfaceClassName="max-w-2xl"
    />
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-[1.4rem] border border-rose-100 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700 sm:px-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-rose-600">
          <i className="fas fa-triangle-exclamation text-xs" />
        </span>
        <p className="leading-6">{message}</p>
      </div>
    </div>
  );
}

export function SummaryStat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: ReactNode;
  tone?: "slate" | "blue" | "emerald" | "amber" | "indigo";
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-100 bg-blue-50/60 text-blue-800"
      : tone === "emerald"
        ? "border-emerald-100 bg-emerald-50/60 text-emerald-800"
        : tone === "amber"
          ? "border-amber-100 bg-amber-50/60 text-amber-800"
          : tone === "indigo"
            ? "border-indigo-100 bg-indigo-50/60 text-indigo-800"
            : "border-slate-200 bg-white text-slate-900";

  return (
    <div className={`panel-card rounded-[1.4rem] border p-4 sm:p-5 ${toneClass}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <div className="mt-2 break-words text-base font-bold leading-snug tracking-tight text-slate-900 sm:text-lg">
        {value}
      </div>
    </div>
  );
}

export function DetailSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="panel-card overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <h2 className="text-base font-black tracking-tight text-slate-900 sm:text-lg">
          {title}
        </h2>
        <p className="mt-1 text-[13px] font-medium leading-6 text-slate-500">
          {subtitle}
        </p>
      </div>
      {children}
    </section>
  );
}

export function EmptySection({
  label,
  icon,
}: {
  label: string;
  icon: string;
}) {
  return (
    <div className="px-5 py-10 sm:px-6 sm:py-14">
      <div className="panel-empty-state px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-300">
        <i className={`fas ${icon} text-xl`} />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
      </div>
    </div>
  );
}
