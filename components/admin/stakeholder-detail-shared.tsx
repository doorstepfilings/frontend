"use client";

import type { ReactNode } from "react";
import { format, isValid } from "date-fns";
import type { AdminRecord } from "@/lib/admin/record-helpers";

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
    return "Regional Manager";
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
  const city = typeof record?.city === "string" ? record.city : "";
  const state = typeof record?.state === "string" ? record.state : "";
  const pincode = typeof record?.pincode === "string" ? record.pincode : "";

  if (city && state && pincode) {
    return `${city}, ${state} ${pincode}`;
  }

  if (city && state) {
    return `${city}, ${state}`;
  }

  if (city || state || pincode) {
    return city || state || pincode;
  }

  return "Not set";
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[24rem] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {label}
        </p>
      </div>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
      {message}
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
      ? "text-blue-700"
      : tone === "emerald"
        ? "text-emerald-700"
        : tone === "amber"
          ? "text-amber-700"
          : tone === "indigo"
            ? "text-indigo-700"
            : "text-gray-900";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <div className={`mt-1 text-lg font-black ${toneClass}`}>{value}</div>
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
    <section className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-[var(--admin-card-shadow)]">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-black text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
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
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-300">
        <i className={`fas ${icon} text-xl`} />
      </div>
      <p className="mt-4 text-sm font-semibold text-gray-500">{label}</p>
    </div>
  );
}
