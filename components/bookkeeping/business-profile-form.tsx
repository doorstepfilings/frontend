"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FormField } from "@/components/ui/core/form-field";
import {
  BUSINESS_PROFILE_STORAGE_KEY,
  businessTypeOptions,
  defaultBusinessProfileValues,
  hasBusinessProfileErrors,
  industryTypeOptions,
  normalizeBusinessProfile,
  paperSizeOptions,
  taxRateOptions,
  validateBusinessProfile,
  type BusinessProfileErrors,
  type BusinessProfileFormValues,
  type PaperSize,
  type TaxCalculation,
} from "@/lib/features/bookkeeping/business-profile";

const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10";
const TEXTAREA_CLASS =
  "min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

type FieldName = keyof BusinessProfileFormValues;
type SelectOption = string | { value: string; label: string };
type BusinessProfileImageField = "logo" | "letterhead" | "signature" | "stamp" | "upiQrCode";

const fileFields = [
  { name: "logo" as const, label: "Business Logo" },
  { name: "letterhead" as const, label: "Letterhead Image" },
  { name: "signature" as const, label: "Signature Image" },
  { name: "stamp" as const, label: "Stamp Image" },
  { name: "upiQrCode" as const, label: "UPI QR Code" },
];

export function BusinessProfileForm() {
  const [form, setForm] = useState<BusinessProfileFormValues>(defaultBusinessProfileValues);
  const [errors, setErrors] = useState<BusinessProfileErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedProfile = window.localStorage.getItem(BUSINESS_PROFILE_STORAGE_KEY);

        if (savedProfile) {
          setForm(normalizeBusinessProfile(JSON.parse(savedProfile)));
          setIsEditMode(true);
        }
      } catch {
        toast.error("Unable to load saved business profile.");
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const updateField = <K extends FieldName>(
    field: K,
    value: BusinessProfileFormValues[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleFileChange = (
    field: BusinessProfileImageField,
    file: File | null,
  ) => {
    if (!file) {
      updateField(field, "");
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Please upload a JPG or PNG image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateField(field, String(reader.result ?? ""));
    };
    reader.onerror = () => toast.error("Unable to preview selected image.");
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateBusinessProfile(form);
    setErrors(nextErrors);

    if (hasBusinessProfileErrors(nextErrors)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      window.localStorage.setItem(BUSINESS_PROFILE_STORAGE_KEY, JSON.stringify(form));
      setIsEditMode(true);
      toast.success("Business profile saved successfully.");
    } catch {
      toast.error("Unable to save business profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
        <p className="text-sm font-semibold text-slate-500">Loading business profile...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">
            Bookkeeping
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Business Profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            Save these details once and reuse them across invoices, quotations,
            proforma invoices, receipts, PDFs, and email templates.
          </p>
        </div>
        <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-800">
          {isEditMode ? "Edit Mode" : "New Profile"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard
          title="Business Details"
          description="Primary identity and contact details for billing documents."
          icon="fa-store"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <TextInput
              label="Business Name"
              required
              value={form.businessName}
              error={errors.businessName}
              onChange={(value) => updateField("businessName", value)}
            />
            <TextInput
              label="Legal Name"
              required
              value={form.legalName}
              error={errors.legalName}
              onChange={(value) => updateField("legalName", value)}
            />
            <SelectInput
              label="Business Type"
              required
              value={form.businessType}
              error={errors.businessType}
              options={businessTypeOptions}
              placeholder="Select business type"
              onChange={(value) => updateField("businessType", value)}
            />
            <SelectInput
              label="Industry Type"
              value={form.industryType}
              options={industryTypeOptions}
              placeholder="Select industry"
              onChange={(value) => updateField("industryType", value)}
            />
            <TextInput
              label="PAN Number"
              value={form.panNumber}
              onChange={(value) => updateField("panNumber", value.toUpperCase())}
            />
            <TextInput
              label="Email"
              required
              type="email"
              value={form.email}
              error={errors.email}
              onChange={(value) => updateField("email", value)}
            />
            <TextInput
              label="Mobile Number"
              required
              value={form.mobile}
              error={errors.mobile}
              onChange={(value) => updateField("mobile", value)}
            />
            <TextInput
              label="Website"
              type="url"
              value={form.website}
              onChange={(value) => updateField("website", value)}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="GST & Address"
          description="Tax registration, calculation preference, and billing address."
          icon="fa-map-location-dot"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <BooleanToggle
              label="GST Registered?"
              required
              checked={form.gstRegistered}
              onChange={(value) => updateField("gstRegistered", value)}
            />
            {form.gstRegistered ? (
              <TextInput
                label="GSTIN"
                required
                value={form.gstin}
                error={errors.gstin}
                onChange={(value) => updateField("gstin", value.toUpperCase())}
              />
            ) : null}
            <TextInput
              label="GST State"
              value={form.gstState}
              onChange={(value) => updateField("gstState", value)}
            />
            <TextInput
              label="State Code"
              value={form.stateCode}
              onChange={(value) => updateField("stateCode", value)}
            />
            <SegmentedControl<TaxCalculation>
              label="Tax Calculation"
              value={form.taxCalculation}
              options={[
                { value: "inclusive", label: "Inclusive" },
                { value: "exclusive", label: "Exclusive" },
              ]}
              onChange={(value) => updateField("taxCalculation", value)}
            />
            <SelectInput
              label="Default Tax Rate"
              value={form.defaultTaxRate}
              options={taxRateOptions.map((rate) => ({ value: rate, label: `${rate}%` }))}
              onChange={(value) => updateField("defaultTaxRate", value)}
            />
            <BooleanToggle
              label="Enable HSN/SAC"
              checked={form.hsnSacEnabled}
              onChange={(value) => updateField("hsnSacEnabled", value)}
            />
            <TextInput
              label="Address Line 1"
              required
              value={form.addressLine1}
              error={errors.addressLine1}
              onChange={(value) => updateField("addressLine1", value)}
            />
            <TextInput
              label="Address Line 2"
              value={form.addressLine2}
              onChange={(value) => updateField("addressLine2", value)}
            />
            <TextInput
              label="City"
              required
              value={form.city}
              error={errors.city}
              onChange={(value) => updateField("city", value)}
            />
            <TextInput
              label="State"
              required
              value={form.state}
              error={errors.state}
              onChange={(value) => updateField("state", value)}
            />
            <TextInput
              label="Country"
              required
              value={form.country}
              error={errors.country}
              onChange={(value) => updateField("country", value)}
            />
            <TextInput
              label="Pincode"
              required
              value={form.pincode}
              error={errors.pincode}
              onChange={(value) => updateField("pincode", value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Logo & Bank Details"
          description="Brand assets, payment information, and bank visibility."
          icon="fa-building-columns"
        >
          <div className="grid gap-5 md:grid-cols-2">
            {fileFields.map((field) => (
              <FilePreviewInput
                key={field.name}
                label={field.label}
                preview={form[field.name]}
                onChange={(file) => handleFileChange(field.name, file)}
                onRemove={() => updateField(field.name, "")}
              />
            ))}
            <ColorInput
              label="Brand Color"
              value={form.brandColor}
              onChange={(value) => updateField("brandColor", value)}
            />
            <BooleanToggle
              label="Show Bank Details"
              checked={form.showBankDetails}
              onChange={(value) => updateField("showBankDetails", value)}
            />
          </div>

          {form.showBankDetails ? (
            <div className="mt-6 grid gap-5 border-t border-slate-100 pt-6 md:grid-cols-2">
              <TextInput
                label="Account Holder Name"
                value={form.accountHolderName}
                onChange={(value) => updateField("accountHolderName", value)}
              />
              <TextInput
                label="Bank Name"
                value={form.bankName}
                onChange={(value) => updateField("bankName", value)}
              />
              <TextInput
                label="Account Number"
                value={form.accountNumber}
                onChange={(value) => updateField("accountNumber", value)}
              />
              <TextInput
                label="IFSC Code"
                value={form.ifscCode}
                onChange={(value) => updateField("ifscCode", value.toUpperCase())}
              />
              <TextInput
                label="UPI ID"
                value={form.upiId}
                onChange={(value) => updateField("upiId", value)}
              />
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Invoice Settings"
          description="Document numbering, prefixes, and financial year setup."
          icon="fa-file-invoice-dollar"
        >
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <TextInput
              label="Financial Year"
              required
              value={form.financialYear}
              error={errors.financialYear}
              onChange={(value) => updateField("financialYear", value)}
            />
            <TextInput
              label="Invoice Prefix"
              required
              value={form.invoicePrefix}
              error={errors.invoicePrefix}
              onChange={(value) => updateField("invoicePrefix", value.toUpperCase())}
            />
            <NumberInput
              label="Invoice Starting Number"
              required
              value={form.invoiceStartNo}
              error={errors.invoiceStartNo}
              onChange={(value) => updateField("invoiceStartNo", value)}
            />
            <TextInput
              label="Quotation Prefix"
              required
              value={form.quotationPrefix}
              error={errors.quotationPrefix}
              onChange={(value) => updateField("quotationPrefix", value.toUpperCase())}
            />
            <NumberInput
              label="Quotation Starting Number"
              required
              value={form.quotationStartNo}
              error={errors.quotationStartNo}
              onChange={(value) => updateField("quotationStartNo", value)}
            />
            <TextInput
              label="Proforma Prefix"
              required
              value={form.proformaPrefix}
              error={errors.proformaPrefix}
              onChange={(value) => updateField("proformaPrefix", value.toUpperCase())}
            />
            <NumberInput
              label="Proforma Starting Number"
              required
              value={form.proformaStartNo}
              error={errors.proformaStartNo}
              onChange={(value) => updateField("proformaStartNo", value)}
            />
            <TextInput
              label="Receipt Prefix"
              value={form.receiptPrefix}
              onChange={(value) => updateField("receiptPrefix", value.toUpperCase())}
            />
            <BooleanToggle
              label="Reset Number Every Year"
              checked={form.resetNumberYearly}
              onChange={(value) => updateField("resetNumberYearly", value)}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Terms & PDF Settings"
          description="Default terms, footer text, paper size, and PDF visibility options."
          icon="fa-file-pdf"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <TextareaInput
              label="Invoice Terms"
              value={form.invoiceTerms}
              onChange={(value) => updateField("invoiceTerms", value)}
            />
            <TextareaInput
              label="Quotation Terms"
              value={form.quotationTerms}
              onChange={(value) => updateField("quotationTerms", value)}
            />
            <TextareaInput
              label="Proforma Terms"
              value={form.proformaTerms}
              onChange={(value) => updateField("proformaTerms", value)}
            />
            <TextareaInput
              label="Footer Note"
              value={form.footerNote}
              onChange={(value) => updateField("footerNote", value)}
            />
            <SegmentedControl<PaperSize>
              label="Paper Size"
              required
              value={form.paperSize}
              error={errors.paperSize}
              options={paperSizeOptions.map((size) => ({ value: size, label: size }))}
              onChange={(value) => updateField("paperSize", value)}
            />
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <BooleanToggle
              label="Show Logo"
              checked={form.showLogo}
              onChange={(value) => updateField("showLogo", value)}
            />
            <BooleanToggle
              label="Show GSTIN"
              checked={form.showGstin}
              onChange={(value) => updateField("showGstin", value)}
            />
            <BooleanToggle
              label="Show PAN"
              checked={form.showPan}
              onChange={(value) => updateField("showPan", value)}
            />
            <BooleanToggle
              label="Show Bank Details"
              checked={form.showBankDetailsPdf}
              onChange={(value) => updateField("showBankDetailsPdf", value)}
            />
            <BooleanToggle
              label="Show Signature"
              checked={form.showSignature}
              onChange={(value) => updateField("showSignature", value)}
            />
            <BooleanToggle
              label="Show Amount in Words"
              checked={form.showAmountWords}
              onChange={(value) => updateField("showAmountWords", value)}
            />
          </div>
        </SectionCard>

        <div className="sticky bottom-0 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-200/60 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-slate-500">
              Details saved here will power billing documents and templates.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-900 px-6 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <i className="fas fa-circle-notch animate-spin" /> : <i className="fas fa-save" />}
              {saving
                ? "Saving..."
                : isEditMode
                  ? "Update Business Profile"
                  : "Save Business Profile"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
            <i className={`fas ${icon}`} />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <FormField label={label} required={required} error={error}>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT_CLASS}
      />
    </FormField>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <FormField label={label} required={required} error={error}>
      <input
        type="number"
        min={1}
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(Number(event.target.value))}
        className={INPUT_CLASS}
      />
    </FormField>
  );
}

function TextareaInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={TEXTAREA_CLASS}
      />
    </FormField>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
  error,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <FormField label={label} required={required} error={error}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT_CLASS}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </FormField>
  );
}

function BooleanToggle({
  label,
  checked,
  onChange,
  required,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  required?: boolean;
}) {
  return (
    <FormField label={label} required={required}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`flex h-12 w-full items-center justify-between rounded-xl border px-4 text-sm font-black uppercase tracking-[0.14em] transition ${
          checked
            ? "border-blue-200 bg-blue-50 text-blue-900"
            : "border-slate-200 bg-slate-50 text-slate-500"
        }`}
      >
        <span>{checked ? "Yes" : "No"}</span>
        <span
          className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
            checked ? "bg-blue-700" : "bg-slate-300"
          }`}
        >
          <span
            className={`h-4 w-4 rounded-full bg-white transition ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
      </button>
    </FormField>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
  required,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <FormField label={label} required={required} error={error}>
      <div className="grid min-h-12 grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
              option.value === value
                ? "bg-blue-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-white hover:text-slate-900"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </FormField>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label}>
      <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-12 cursor-pointer rounded-md border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none"
        />
      </div>
    </FormField>
  );
}

function FilePreviewInput({
  label,
  preview,
  onChange,
  onRemove,
}: {
  label: string;
  preview: string;
  onChange: (file: File | null) => void;
  onRemove: () => void;
}) {
  return (
    <FormField label={label}>
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt={`${label} preview`} className="h-full w-full object-contain" />
            ) : (
              <i className="fas fa-image text-xl text-slate-300" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              onChange={(event) => onChange(event.target.files?.[0] ?? null)}
              className="block w-full text-xs font-semibold text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-wider file:text-blue-800"
            />
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              JPG or PNG only
            </p>
            {preview ? (
              <button
                type="button"
                onClick={onRemove}
                className="text-xs font-bold text-rose-600 hover:text-rose-700"
              >
                Remove image
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </FormField>
  );
}
