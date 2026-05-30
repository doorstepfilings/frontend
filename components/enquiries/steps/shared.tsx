"use client";

import { FormSelect, FormTextarea } from "@/components/ui/form-controls";

type InquiryTextFieldProps = {
  label: string;
  name: string;
  value: string | number;
  onChange: (name: string, value: string) => void;
  error?: string;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "number";
  required?: boolean;
  helpText?: string;
};

type ChoiceCardProps = {
  title: string;
  description?: string;
  active?: boolean;
  onClick: () => void;
};

type ReviewRowProps = {
  label: string;
  value: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <p className="text-[11px] font-black uppercase tracking-[0.35em] text-sky-700/70">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export function InquiryTextField({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  required = false,
  helpText,
}: InquiryTextFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-slate-700"
      >
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </label>
      <input
        id={name}
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder}
        className={`h-12 w-full rounded-2xl border bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:ring-4 ${
          error
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10"
            : "border-slate-200 focus:border-sky-500 focus:ring-sky-500/10"
        }`}
      />
      {error ? (
        <p className="text-sm font-medium text-rose-600">{error}</p>
      ) : helpText ? (
        <p className="text-sm text-slate-500">{helpText}</p>
      ) : null}
    </div>
  );
}

export function InquirySelectField({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  options,
  helpText,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  helpText?: string;
}) {
  return (
    <FormSelect
      label={label}
      name={name}
      value={value}
      onChange={(event) => onChange(name, event.target.value)}
      error={error}
      required={required}
      placeholder={placeholder}
      options={options}
      helpText={helpText}
    />
  );
}

export function InquiryTextareaField({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  helpText,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
}) {
  return (
    <FormTextarea
      label={label}
      name={name}
      value={value}
      onChange={(event) => onChange(name, event.target.value)}
      error={error}
      placeholder={placeholder}
      required={required}
      helpText={helpText}
      rows={4}
    />
  );
}

export function ChoiceCard({
  title,
  description,
  active = false,
  onClick,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[1.75rem] border p-5 text-left transition-all ${
        active
          ? "border-sky-300 bg-sky-50 shadow-lg shadow-sky-500/10"
          : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
        <span
          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] ${
            active
              ? "border-sky-500 bg-sky-500 text-white"
              : "border-slate-300 bg-white text-slate-300"
          }`}
        >
          <i className={`fas ${active ? "fa-check" : "fa-plus"}`} />
        </span>
      </div>
    </button>
  );
}

export function ReviewRow({ label, value }: ReviewRowProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value || "Not provided"}
      </p>
    </div>
  );
}
