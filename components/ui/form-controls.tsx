import React from "react";
import { SearchableSelect } from "./searchable-select";

interface FormSelectProps {
  label?: string;
  name?: string;
  value?: string | number | (string | number)[] | null;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: React.FocusEventHandler<HTMLSelectElement>;
  error?: string;
  helpText?: string | null;
  placeholder?: string;
  options: { value: string | number; label: string }[];
  disabled?: boolean;
  required?: boolean;
  className?: string;
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
  ...props
}: FormSelectProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-semibold text-gray-700"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <SearchableSelect
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur as any}
          disabled={disabled}
          placeholder={placeholder}
          options={options}
          error={!!error}
          className={className}
          {...props}
        />
      </div>

      {error && (
        <p className="flex items-center gap-1 text-sm text-red-600">
          <i className="fas fa-exclamation-circle text-xs"></i>
          {error}
        </p>
      )}

      {helpText && !error && <p className="text-sm text-gray-500">{helpText}</p>}
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
        w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-vertical
        ${error ? "border-red-500 ring-1 ring-red-200" : ""}
        ${
          disabled
            ? "bg-gray-50 text-gray-500 cursor-not-allowed"
            : "bg-white hover:border-gray-300"
        }
        ${className}
    `;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-semibold text-gray-700"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
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
          <div className="absolute bottom-2 right-3 text-xs text-gray-400">
            {typeof value === "string" ? value.length : 0}/{maxLength}
          </div>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-sm text-red-600">
          <i className="fas fa-exclamation-circle text-xs"></i>
          {error}
        </p>
      )}

      {helpText && !error && <p className="text-sm text-gray-500">{helpText}</p>}
    </div>
  );
};
