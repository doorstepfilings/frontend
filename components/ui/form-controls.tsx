import React from "react";
import { SearchSelect } from "@/components/ui/core/search-select";

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string | null;
  placeholder?: string;
  options: { value: string | number; label: string }[];
}

export const FormSelect = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  className = "",
  options = [],
  helpText = null,
}: FormSelectProps) => {
  const selectOptions = [
    { value: "", label: placeholder },
    ...options.map((option) => ({
      value: String(option.value),
      label: option.label,
    })),
  ];

  const emitChangeEvent = (nextValue: string) => {
    if (!onChange) {
      return;
    }

    const target = {
      name,
      value: nextValue,
    } as HTMLSelectElement;

    onChange({
      target,
      currentTarget: target,
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  const emitBlurEvent = () => {
    if (!onBlur) {
      return;
    }

    const target = {
      name,
      value: String(value ?? ""),
    } as HTMLSelectElement;

    onBlur({
      target,
      currentTarget: target,
    } as React.FocusEvent<HTMLSelectElement>);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-semibold text-slate-700"
        >
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <SearchSelect
          options={selectOptions}
          value={String(value ?? "")}
          onChange={emitChangeEvent}
          onBlur={emitBlurEvent}
          placeholder={placeholder}
          disabled={disabled}
          name={name}
          required={required}
          searchable={options.length > 7}
          treatEmptyValueAsPlaceholder
          selectStyle={{
            borderColor: error ? "#f43f5e" : "#e2e8f0",
            boxShadow: error
              ? "0 0 0 1px rgba(244, 63, 94, 0.16)"
              : "0 1px 2px rgba(15, 23, 42, 0.05)",
            background: disabled ? "#f8fafc" : "#ffffff",
          }}
          triggerClassName={`min-h-[3.5rem] rounded-2xl px-4 py-3 panel-select ${
            disabled ? "cursor-not-allowed opacity-70" : ""
          } ${className}`}
          valueLabelClassName="text-sm font-semibold text-slate-700"
          handleClassName="h-8 w-8 rounded-lg border-0 bg-transparent text-slate-400"
          searchInputClassName="rounded-xl"
        />
      </div>

      {error && (
        <p className="flex items-center gap-1 text-sm text-rose-600">
          <i className="fas fa-exclamation-circle text-xs"></i>
          {error}
        </p>
      )}

      {helpText && !error && <p className="text-sm text-slate-500">{helpText}</p>}
    </div>
  );
};

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string | null;
}

export const FormTextarea = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  disabled = false,
  required = false,
  className = "",
  rows = 4,
  maxLength,
  helpText = null,
  ...props
}: FormTextareaProps) => {
  const textareaClasses = `
        w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm panel-textarea resize-y
        ${error ? "border-rose-500 ring-1 ring-rose-200" : ""}
        ${
          disabled
            ? "bg-slate-50 text-slate-400 cursor-not-allowed"
            : "hover:border-slate-300"
        }
        ${className}
    `;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-semibold text-slate-700"
        >
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={textareaClasses}
          {...props}
        />

        {maxLength && (
          <div className="absolute bottom-2 right-3 text-xs text-slate-400">
            {typeof value === "string" ? value.length : 0}/{maxLength}
          </div>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-sm text-rose-600">
          <i className="fas fa-exclamation-circle text-xs"></i>
          {error}
        </p>
      )}

      {helpText && !error && <p className="text-sm text-slate-500">{helpText}</p>}
    </div>
  );
};
