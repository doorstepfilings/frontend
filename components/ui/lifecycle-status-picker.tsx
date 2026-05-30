"use client";

import type {
  LifecycleStatusGroup,
  LifecycleStatusOption,
} from "@/lib/workflows/lifecycle-status";

function withAlpha(color: string, alphaHex: string) {
  const normalized = String(color ?? "").trim();

  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return `${normalized}${alphaHex}`;
  }

  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    const expanded = `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
    return `${expanded}${alphaHex}`;
  }

  return normalized || "#e2e8f0";
}

function LifecycleStatusCard({
  onSelect,
  option,
  selected,
}: {
  onSelect: (value: string) => void;
  option: LifecycleStatusOption;
  selected: boolean;
}) {
  const borderColor = selected ? option.color : "#e2e8f0";
  const accentBackground = withAlpha(option.color, "18");
  const accentBorder = withAlpha(option.color, "2f");

  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className={`w-full rounded-3xl border bg-white p-4 text-left transition-all ${
        selected
          ? "shadow-[0_18px_40px_-28px_rgba(15,23,42,0.5)]"
          : "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_36px_-30px_rgba(15,23,42,0.45)]"
      }`}
      style={{ borderColor }}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
          style={{
            backgroundColor: accentBackground,
            borderColor: accentBorder,
            color: option.color,
          }}
        >
          <i className={`fas ${option.icon} text-base`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold tracking-tight text-slate-900">
              {option.label}
            </p>
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{
                backgroundColor: accentBackground,
                color: option.color,
              }}
            >
              {option.kind === "default" ? "Default" : "Special"}
            </span>
            {option.stage && !option.stage.is_active ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Inactive In Library
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {option.description}
          </p>
        </div>

        <div
          className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
          style={{
            borderColor: selected ? option.color : "#cbd5e1",
            backgroundColor: selected ? option.color : "transparent",
            color: selected ? "#ffffff" : "#94a3b8",
          }}
        >
          <i
            className={`fas ${
              selected ? "fa-check" : "fa-circle"
            } text-[10px]`}
          />
        </div>
      </div>
    </button>
  );
}

export function LifecycleStatusPicker({
  groups,
  helpText,
  label,
  loading = false,
  onChange,
  value,
}: {
  groups: LifecycleStatusGroup[];
  helpText?: string | null;
  label: string;
  loading?: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-semibold text-slate-900">
          {label}
        </label>
        {loading ? (
          <p className="text-xs font-medium text-slate-500">
            Syncing shared milestone labels...
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-4"
          >
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {group.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {group.description}
              </p>
            </div>

            <div className="space-y-3">
              {group.options.map((option) => (
                <LifecycleStatusCard
                  key={option.value}
                  option={option}
                  selected={value === option.value}
                  onSelect={onChange}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {helpText ? (
        <p className="text-sm leading-6 text-slate-500">{helpText}</p>
      ) : null}
    </div>
  );
}
