import { format } from "date-fns";

type DateInput = string | number | Date | null | undefined;

function resolveDate(value: DateInput) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  const date = resolveDate(value);
  if (!date) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string) {
  if (!value) {
    return "Not available";
  }

  const date = resolveDate(value);
  if (!date) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateWithPattern(
  value: DateInput,
  pattern: string,
  fallback = "Not available",
) {
  const date = resolveDate(value);

  if (!date) {
    return fallback;
  }

  return format(date, pattern);
}
