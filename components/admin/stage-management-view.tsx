"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, isValid } from "date-fns";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";
import { adminApi, type AdminStage } from "@/lib/api/admin-api";
import { parseApiError } from "@/lib/utils/error-parser";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "react-hot-toast";

type StageFilter = "all" | "active" | "inactive" | "default" | "custom";

function normalizeStage(stage: unknown): AdminStage {
  const source = (stage ?? {}) as Record<string, unknown>;

  return {
    id: Number(source.id ?? 0),
    name: String(source.name ?? ""),
    slug: String(source.slug ?? ""),
    color: String(source.color ?? "#1d4ed8"),
    is_active: Boolean(source.is_active ?? source.isActive ?? false),
    isActive: Boolean(source.is_active ?? source.isActive ?? false),
    is_default: Boolean(source.is_default ?? source.isDefault ?? false),
    isDefault: Boolean(source.is_default ?? source.isDefault ?? false),
    created_at:
      typeof source.created_at === "string"
        ? source.created_at
        : typeof source.createdAt === "string"
          ? source.createdAt
          : null,
    updated_at:
      typeof source.updated_at === "string"
        ? source.updated_at
        : typeof source.updatedAt === "string"
          ? source.updatedAt
          : null,
  };
}

function formatStageDate(rawDate?: string | null) {
  if (!rawDate) {
    return "-";
  }

  const resolvedDate = new Date(rawDate);
  return isValid(resolvedDate) ? format(resolvedDate, "dd MMM yyyy") : "-";
}

export function StageManagementView() {
  const { confirm, ConfirmDialog } = useConfirm();
  const [stages, setStages] = useState<AdminStage[]>([]);
  const [defaultWorkflowCount, setDefaultWorkflowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StageFilter>("all");
  const [deletingStageId, setDeletingStageId] = useState<number | null>(null);

  async function fetchStageLibrary() {
    const [stagesResponse, workflowResponse] = await Promise.all([
      adminApi.getStages(),
      adminApi.getDefaultWorkflow(),
    ]);
    const payload = stagesResponse.data?.data ?? stagesResponse.data;
    const workflowPayload =
      workflowResponse.data?.data ?? workflowResponse.data;

    return {
      stages: Array.isArray(payload) ? payload.map(normalizeStage) : [],
      workflowCount: Array.isArray(workflowPayload) ? workflowPayload.length : 0,
    };
  }

  async function loadStages(isMounted = { current: true }) {
    setLoading(true);

    try {
      const library = await fetchStageLibrary();

      if (!isMounted.current) {
        return;
      }

      setStages(library.stages);
      setDefaultWorkflowCount(library.workflowCount);
      setError(null);
    } catch (requestError) {
      if (!isMounted.current) {
        return;
      }
      setError(parseApiError(requestError));
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const isMounted = { current: true };

    const initializeStages = async () => {
      try {
        const library = await fetchStageLibrary();

        if (!isMounted.current) {
          return;
        }

        setStages(library.stages);
        setDefaultWorkflowCount(library.workflowCount);
        setError(null);
      } catch (requestError) {
        if (!isMounted.current) {
          return;
        }
        setError(parseApiError(requestError));
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    void initializeStages();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const filteredStages = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...stages]
      .filter((stage) => {
        const haystack = `${stage.name} ${stage.slug} ${stage.color}`.toLowerCase();
        const matchesSearch =
          normalizedSearch.length === 0 || haystack.includes(normalizedSearch);

        const isDefault = Boolean(stage.is_default || stage.isDefault);
        const matchesFilter =
          filter === "all" ||
          (filter === "active" && stage.is_active) ||
          (filter === "inactive" && !stage.is_active) ||
          (filter === "default" && isDefault) ||
          (filter === "custom" && !isDefault);

        return matchesSearch && matchesFilter;
      })
      .sort((left, right) => {
        const leftIsDefault = Number(Boolean(left.is_default || left.isDefault));
        const rightIsDefault = Number(Boolean(right.is_default || right.isDefault));

        if (leftIsDefault !== rightIsDefault) {
          return rightIsDefault - leftIsDefault;
        }

        if (Number(left.is_active) !== Number(right.is_active)) {
          return Number(right.is_active) - Number(left.is_active);
        }

        return left.name.localeCompare(right.name);
      });
  }, [filter, search, stages]);

  const summary = useMemo(() => {
    const active = stages.filter((stage) => stage.is_active).length;
    const defaultStages = stages.filter(
      (stage) => stage.is_default || stage.isDefault,
    ).length;

    return {
      total: stages.length,
      active,
      inactive: stages.length - active,
      defaultStages,
      custom: stages.length - defaultStages,
      visible: filteredStages.length,
    };
  }, [filteredStages.length, stages]);

  const hasActiveFilters = search.trim().length > 0 || filter !== "all";

  async function handleDelete(stage: AdminStage) {
    if (stage.is_default || stage.isDefault) {
      toast.error("Default milestones can be edited but not deleted");
      return;
    }

    const isConfirmed = await confirm({
      title: "Delete milestone",
      message: `Delete "${stage.name}" from the global milestone library?`,
      confirmLabel: "Delete milestone",
      variant: "danger",
    });

    if (!isConfirmed) {
      return;
    }

    setDeletingStageId(stage.id);
    try {
      await adminApi.deleteStage(stage.id);
      toast.success("Milestone deleted");
      await loadStages();
    } catch (requestError) {
      toast.error(parseApiError(requestError));
    } finally {
      setDeletingStageId(null);
    }
  }

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="mx-auto max-w-7xl space-y-6 px-4 pb-24 sm:px-6 lg:px-8">
          <ConfirmDialog />

          <section className="flex flex-col gap-4 border-b border-slate-200 pb-6 pt-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                <Link href="/admin/services" className="transition hover:text-blue-600">
                  Service Designer
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600">Milestones</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-950">
                  Milestones Library
                </h1>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {summary.total} total
                </span>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">
                Reusable milestones shared across service workflows. Configure the
                default sequence here and add new milestones only when the library
                needs them.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/stages/workflow"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold uppercase tracking-[0.1em] text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                <i className="fas fa-route text-sm text-slate-400" />
                Default Sequence
              </Link>
              <Link
                href="/admin/stages/create"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-blue-700"
              >
                <i className="fas fa-plus text-sm" />
                Add Milestone
              </Link>
            </div>
          </section>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-20 shadow-sm">
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Loading milestones...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center rounded-2xl border border-rose-100 bg-rose-50/50 p-8 text-center shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <i className="fas fa-exclamation-circle text-lg" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Failed to load library
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">{error}</p>
              <Button
                type="button"
                variant="outline"
                className="mt-5 h-11 rounded-2xl border-slate-200 bg-white px-6 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 transition hover:border-slate-300"
                onClick={() => void loadStages()}
              >
                Retry Loading
              </Button>
            </div>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50/70 p-5 sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <i className="fas fa-search text-sm" />
                    </span>
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by milestone name, slug, or color..."
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative min-w-[220px]">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                        <i className="fas fa-filter text-xs" />
                      </span>
                      <select
                        value={filter}
                        onChange={(event) => setFilter(event.target.value as StageFilter)}
                        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      >
                        <option value="all">All Milestones</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                        <option value="default">Default Only</option>
                        <option value="custom">Custom Only</option>
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                        <i className="fas fa-chevron-down text-xs" />
                      </span>
                    </div>

                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setFilter("all");
                        }}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold uppercase tracking-[0.1em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <SummaryBadge label="Active" value={summary.active} tone="emerald" />
                  <SummaryBadge label="Inactive" value={summary.inactive} tone="slate" />
                  <SummaryBadge label="Default" value={summary.defaultStages} tone="blue" />
                  <SummaryBadge label="Custom" value={summary.custom} tone="amber" />
                  <SummaryBadge
                    label="Default Sequence"
                    value={defaultWorkflowCount}
                    tone="indigo"
                  />
                  <SummaryBadge label="Showing" value={summary.visible} tone="slate" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white">
                      <th className="pl-8 pr-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Milestone
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Slug
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Color
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Status
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Type
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Updated
                      </th>
                      <th className="pl-6 pr-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStages.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-24 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-300">
                              <i className="fas fa-layer-group text-xl" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">
                                No milestones found
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Try a different search term or reset the filter.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStages.map((stage) => {
                        const isDefault = Boolean(stage.is_default || stage.isDefault);
                        const updatedDate = formatStageDate(
                          stage.updated_at ?? stage.created_at ?? null,
                        );
                        const createdDate = formatStageDate(stage.created_at ?? null);
                        const firstLetter = stage.name.charAt(0).toUpperCase();
                        const hexColor = stage.color || "#3b82f6";
                        const bgStyle = {
                          backgroundColor: `${hexColor}15`,
                          color: hexColor,
                        };

                        return (
                          <tr
                            key={stage.id}
                            className="border-l-4 transition-colors hover:bg-slate-50/70"
                            style={{ borderLeftColor: hexColor }}
                          >
                            <td className="pl-8 pr-6 py-4">
                              <div className="flex items-center gap-4">
                                <div
                                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black tracking-tight"
                                  style={bgStyle}
                                >
                                  {firstLetter}
                                </div>
                                <div>
                                  <p className="text-sm font-bold tracking-tight text-slate-900">
                                    {stage.name}
                                  </p>
                                  <p className="mt-1 text-[11px] font-semibold text-slate-400">
                                    Created {createdDate}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 font-mono text-[11px] font-semibold text-slate-600">
                                {stage.slug}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] font-semibold tracking-tight"
                                style={{
                                  backgroundColor: `${hexColor}08`,
                                  borderColor: `${hexColor}20`,
                                  color: hexColor,
                                }}
                              >
                                <span
                                  className="inline-flex h-2 w-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: hexColor }}
                                />
                                <span className="font-mono uppercase">{hexColor}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                                  stage.is_active
                                    ? "border border-emerald-500/10 bg-emerald-500/10 text-emerald-700"
                                    : "border border-slate-500/10 bg-slate-500/10 text-slate-600"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    stage.is_active ? "bg-emerald-500" : "bg-slate-400"
                                  }`}
                                />
                                {stage.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                                  isDefault
                                    ? "border border-blue-500/10 bg-blue-500/10 text-blue-700"
                                    : "border border-amber-500/10 bg-amber-500/10 text-amber-700"
                                }`}
                              >
                                <i
                                  className={`fas ${
                                    isDefault ? "fa-star-of-life" : "fa-sliders-h"
                                  } text-[9px]`}
                                />
                                {isDefault ? "Default" : "Custom"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold text-slate-500">
                                {updatedDate}
                              </span>
                            </td>
                            <td className="pl-6 pr-8 py-4">
                              <div className="flex justify-end gap-1.5">
                                <Link
                                  href={`/admin/stages/edit/${stage.id}`}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-blue-600"
                                  title="Edit Milestone"
                                >
                                  <i className="fas fa-pencil-alt text-xs" />
                                </Link>
                                {isDefault ? (
                                  <button
                                    type="button"
                                    disabled
                                    className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-300"
                                    title="System default milestones cannot be deleted"
                                  >
                                    <i className="fas fa-lock text-xs" />
                                  </button>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 p-0 text-rose-500 transition hover:border-rose-200 hover:bg-rose-100 hover:text-rose-700"
                                    onClick={() => void handleDelete(stage)}
                                    loading={deletingStageId === stage.id}
                                    title="Delete Milestone"
                                  >
                                    <i className="fas fa-trash-alt text-xs" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-600">
                  Showing {filteredStages.length} of {stages.length} milestones
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Default milestones stay locked from deletion.
                </p>
              </div>
            </section>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

function SummaryBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "blue" | "emerald" | "amber" | "indigo";
}) {
  const toneClasses = {
    slate: "border-slate-200 bg-white text-slate-600",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    indigo: "border-indigo-100 bg-indigo-50 text-indigo-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${toneClasses[tone]}`}
    >
      <span>{label}</span>
      <span className="font-black text-slate-950">{value}</span>
    </span>
  );
}
