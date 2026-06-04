"use client";

import React from "react";

interface FormDataRendererProps {
  formData: Record<string, unknown>;
  title?: string;
  icon?: string;
}

const FIELD_LABELS: Record<string, string> = {
  address: "Detailed Address",
  appointment_request: "Appointment Request",
  city: "City",
  district: "District",
  email: "Email",
  fullName: "Full Name",
  landmark: "Landmark",
  notes: "Additional Notes",
  phone: "Mobile Number",
  pincode: "Pincode",
  pricing_plan: "Pricing Plan",
  scheduled_date: "Scheduled Date",
  scheduled_time: "Scheduled Time",
  state: "State",
};

const HIDDEN_FIELD_KEYS = new Set(["countryIso", "dialCode"]);

function getFieldLabel(key: string) {
  return (
    FIELD_LABELS[key] ??
    key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function isDisplayableValue(value: unknown) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return false;
  }

  return true;
}

function formatFieldValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => String(item))
      .join(", ");
  }

  return String(value);
}

export function FormDataRenderer({
  formData,
  title = "Application Details",
  icon = "fa-file-alt",
}: FormDataRendererProps) {
  if (!formData || Object.keys(formData).length === 0) return null;

  const fields = Object.entries(formData).filter(
    ([key, value]) => !HIDDEN_FIELD_KEYS.has(key) && isDisplayableValue(value),
  );

  if (fields.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <h3 className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 sm:mb-8">
        <i className={`fas ${icon} text-blue-600`} />
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        {fields.map(([key, value]) => {
          return (
            <div
              key={key}
              className="group border-b border-slate-50 pb-4 last:border-0 last:pb-0"
            >
              <p className="mb-1 break-words text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {getFieldLabel(key)}
              </p>
              <p className="break-words text-sm font-semibold leading-tight text-slate-900">
                {formatFieldValue(value)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
