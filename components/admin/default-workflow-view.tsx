"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "react-hot-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";
import {
  adminApi,
  type AdminDefaultWorkflow,
  type AdminStage,
} from "@/lib/api/admin-api";
import { parseApiError } from "@/lib/utils/error-parser";
import { useConfirm } from "@/hooks/use-confirm";

const PANEL_CLASS = "rounded-3xl border border-slate-200 bg-white shadow-sm";
const INPUT_CLASS =
  "w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const KICKER_CLASS =
  "text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400";

type ApplyResult = {
  applied_service_count: number;
  applied_service_ids: number[];
  blocked_service_ids: number[];
  overwrite: boolean;
  requested_service_count: number;
  skipped_service_count: number;
  skipped_service_ids: number[];
};

type ApiRecord = Record<string, unknown>;

function unwrapApiData<T>(payload: unknown): T {
  const source = payload as { data?: unknown } | null | undefined;
  return (source?.data ?? payload) as T;
}

function normalizeStage(stage: unknown): AdminStage {
  const source = (stage ?? {}) as ApiRecord;

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

function normalizeDefaultWorkflow(
  workflow: unknown,
): AdminDefaultWorkflow {
  const source = (workflow ?? {}) as ApiRecord;

  return {
    id: Number(source.id ?? 0),
    stage_id: Number(source.stage_id ?? source.stageId ?? 0),
    position: Number(source.position ?? 0),
    is_required: Boolean(
      source.is_required ?? source.isRequired ?? true,
    ),
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
    stage: source.stage ? normalizeStage(source.stage) : null,
  };
}

function buildWorkflowKey(items: AdminDefaultWorkflow[]) {
  return items
    .map((item) => `${item.stage_id}:${item.position}:${Number(item.is_required)}`)
    .join("|");
}

function normalizeWorkflowPositions(items: AdminDefaultWorkflow[]) {
  return items.map((item, index) => ({
    ...item,
    position: index + 1,
  }));
}

function buildApplySummary(result: ApplyResult) {
  return [
    `${result.applied_service_count} applied`,
    `${result.skipped_service_count} skipped`,
    `${result.blocked_service_ids.length} blocked`,
  ].join(" | ");
}

async function fetchDefaultWorkflowData() {
  const [stagesResponse, workflowResponse] = await Promise.all([
    adminApi.getStages(),
    adminApi.getDefaultWorkflow(),
  ]);
  const nextStages = unwrapApiData<ApiRecord[]>(stagesResponse.data);
  const nextWorkflow = unwrapApiData<ApiRecord[]>(workflowResponse.data);
  const normalizedStages = Array.isArray(nextStages)
    ? nextStages.map(normalizeStage)
    : [];
  const normalizedWorkflow = Array.isArray(nextWorkflow)
    ? normalizeWorkflowPositions(nextWorkflow.map(normalizeDefaultWorkflow))
    : [];

  return {
    normalizedStages,
    normalizedWorkflow,
  };
}

export function DefaultWorkflowView() {
  const { confirm, ConfirmDialog } = useConfirm();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const [stages, setStages] = useState<AdminStage[]>([]);
  const [workflowItems, setWorkflowItems] = useState<AdminDefaultWorkflow[]>([]);
  const [syncedWorkflowKey, setSyncedWorkflowKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appendStageId, setAppendStageId] = useState("");
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [lastApplyResult, setLastApplyResult] = useState<ApplyResult | null>(
    null,
  );
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [showRequiredStatus, setShowRequiredStatus] = useState(true);

  const orderedWorkflow = useMemo(
    () =>
      [...workflowItems].sort(
        (left, right) =>
          Number(left.position) - Number(right.position) ||
          Number(left.id) - Number(right.id),
      ),
    [workflowItems],
  );

  const assignedStageIds = useMemo(
    () => new Set(orderedWorkflow.map((item) => Number(item.stage_id))),
    [orderedWorkflow],
  );

  const availableStages = useMemo(
    () =>
      stages.filter(
        (stage) => stage.is_active && !assignedStageIds.has(Number(stage.id)),
      ),
    [assignedStageIds, stages],
  );

  const hasDirtyTemplate =
    buildWorkflowKey(orderedWorkflow) !== syncedWorkflowKey;

  const summary = useMemo(
    () => ({
      activeStages: stages.filter((stage) => stage.is_active).length,
      inactiveStages: stages.filter((stage) => !stage.is_active).length,
      requiredSteps: orderedWorkflow.filter((item) => item.is_required).length,
      steps: orderedWorkflow.length,
    }),
    [orderedWorkflow, stages],
  );

  const templateState = useMemo(() => {
    if (orderedWorkflow.length === 0) {
      return {
        label: "Not configured",
        description: "Start by selecting milestones from the library.",
        tone: "slate" as const,
      };
    }

    if (hasDirtyTemplate) {
      return {
        label: "Draft changes",
        description: "Save the latest edits before applying this template.",
        tone: "amber" as const,
      };
    }

    return {
      label: "Saved template",
      description: "Ready for all new services immediately.",
      tone: "emerald" as const,
    };
  }, [hasDirtyTemplate, orderedWorkflow.length]);

  const rolloutLockedReason = loading
    ? "Loading current template..."
    : orderedWorkflow.length === 0
      ? "Build the workflow first."
      : hasDirtyTemplate
        ? "Save your draft before rollout."
        : null;
  async function loadData(isMounted = { current: true }) {
    setLoading(true);

    try {
      const { normalizedStages, normalizedWorkflow } =
        await fetchDefaultWorkflowData();

      if (!isMounted.current) {
        return;
      }

      setStages(normalizedStages);
      setWorkflowItems(normalizedWorkflow);
      setSyncedWorkflowKey(buildWorkflowKey(normalizedWorkflow));
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

    const initializeData = async () => {
      try {
        const { normalizedStages, normalizedWorkflow } =
          await fetchDefaultWorkflowData();

        if (!isMounted.current) {
          return;
        }

        setStages(normalizedStages);
        setWorkflowItems(normalizedWorkflow);
        setSyncedWorkflowKey(buildWorkflowKey(normalizedWorkflow));
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

    void initializeData();

    return () => {
      isMounted.current = false;
    };
  }, []);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedWorkflow.findIndex(
      (item) => item.id === Number(active.id),
    );
    const newIndex = orderedWorkflow.findIndex(
      (item) => item.id === Number(over.id),
    );

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextOrder = normalizeWorkflowPositions(
      arrayMove(orderedWorkflow, oldIndex, newIndex),
    );
    setWorkflowItems(nextOrder);
  }

  function handleInsertStage(stageIdValue: string, position: number) {
    const stageId = Number(stageIdValue);
    const stage = stages.find((candidate) => Number(candidate.id) === stageId);

    if (!stageIdValue || !stage || !stage.is_active) {
      toast.error("Please choose an active milestone first");
      return;
    }

    if (assignedStageIds.has(stageId)) {
      toast.error("This milestone is already in the global workflow");
      return;
    }

    const nextItems = normalizeWorkflowPositions([
      ...orderedWorkflow.slice(0, position - 1),
      {
        id: Date.now() + position,
        stage_id: stageId,
        position,
        is_required: true,
        created_at: null,
        updated_at: null,
        stage,
      },
      ...orderedWorkflow.slice(position - 1),
    ]);

    setWorkflowItems(nextItems);
    setAppendStageId("");
  }

  function handleToggleRequired(itemId: number) {
    setWorkflowItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? { ...item, is_required: !item.is_required }
          : item,
      ),
    );
  }

  function handleRemove(itemId: number) {
    setWorkflowItems((current) =>
      normalizeWorkflowPositions(
        current.filter((item) => Number(item.id) !== Number(itemId)),
      ),
    );
  }

  async function handleSaveTemplate() {
    if (orderedWorkflow.length === 0) {
      toast.error("Add at least one milestone to the global workflow");
      return;
    }

    setSaving(true);
    try {
      const response = await adminApi.replaceDefaultWorkflow({
        items: orderedWorkflow.map((item, index) => ({
          stageId: Number(item.stage_id),
          position: index + 1,
          isRequired: Boolean(item.is_required),
        })),
      });
      const nextWorkflow = unwrapApiData<ApiRecord[]>(response.data);
      const normalizedWorkflow = Array.isArray(nextWorkflow)
        ? normalizeWorkflowPositions(nextWorkflow.map(normalizeDefaultWorkflow))
        : [];

      setWorkflowItems(normalizedWorkflow);
      setSyncedWorkflowKey(buildWorkflowKey(normalizedWorkflow));
      toast.success("Global workflow saved");
    } catch (requestError) {
      toast.error(parseApiError(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleApplyTemplate() {
    const isConfirmed = await confirm({
      title: overwriteExisting
        ? "Replace existing service workflows?"
        : "Apply global workflow to existing services?",
      message: overwriteExisting
        ? "Completed and closed services will keep their current workflow. Ongoing and new services will follow the updated workflow."
        : "Only services without a workflow will receive the global template.",
      confirmLabel: overwriteExisting ? "Replace eligible services" : "Apply to services",
      variant: overwriteExisting ? "danger" : "primary",
    });

    if (!isConfirmed) {
      return;
    }

    setApplying(true);
    try {
      const response = await adminApi.applyDefaultWorkflow({
        overwrite: overwriteExisting,
      });
      const result = unwrapApiData<ApplyResult>(response.data);

      setLastApplyResult(result);
      toast.success(buildApplySummary(result));
    } catch (requestError) {
      toast.error(parseApiError(requestError));
    } finally {
      setApplying(false);
    }
  }

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="mx-auto max-w-7xl space-y-6 pb-24 px-4 sm:px-6 lg:px-8">
          <ConfirmDialog />

          {/* Top Breadcrumb & Actions Bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              <Link href="/admin/services" className="hover:text-blue-600 transition">
                Service Designer
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">Milestone Sequence</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/stages"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-bold uppercase tracking-[0.1em] text-slate-700 transition hover:border-slate-300 hover:text-slate-900 shadow-sm"
              >
                <i className="fas fa-layer-group text-slate-400 text-sm" />
                Milestone Library
              </Link>
              <Button
                type="button"
                onClick={() => void handleSaveTemplate()}
                loading={saving}
                disabled={!hasDirtyTemplate}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-bold uppercase tracking-[0.1em] text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:bg-slate-50 disabled:text-slate-400 shadow-sm"
              >
                <i className="far fa-save text-slate-400 text-sm" />
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={() => void handleApplyTemplate()}
                loading={applying}
                disabled={Boolean(rolloutLockedReason)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <i className="fas fa-rocket text-sm" />
                Publish Workflow
              </Button>
            </div>
          </div>

          {/* Title and Description */}
          <div className="flex flex-col gap-2 pt-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              Milestone Sequence
            </h1>
            <p className="text-sm font-medium text-slate-500">
              {summary.steps} step{summary.steps === 1 ? "" : "s"} in the
              default workflow.
            </p>
          </div>

    <div className={`${PANEL_CLASS} p-6`}>
  <div className="space-y-1">
    <p className={KICKER_CLASS}>Workflow Controls</p>

    <h2 className="text-2xl font-black tracking-tight text-slate-900">
      Build, save, and apply the shared milestone sequence
    </h2>
  </div>

  <div className="mt-8 border-t border-slate-200 pt-8">
    <div className="grid gap-6 xl:grid-cols-[1fr_auto_auto] xl:items-end">
      
      {/* Dropdown */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-900">
          Add Milestone
        </label>

        <div className="relative min-w-[320px]">
          <select
            value={appendStageId}
            onChange={(event) => {
              const val = event.target.value;
              setAppendStageId(val);

              if (val) {
                handleInsertStage(val, orderedWorkflow.length + 1);
              }
            }}
            disabled={availableStages.length === 0}
            className={`${INPUT_CLASS} h-14 rounded-2xl border border-slate-200 bg-white pr-12 shadow-sm appearance-none`}
          >
            <option value="">
              Select reusable milestone
            </option>

            {availableStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
            <i className="fas fa-chevron-down text-xs" />
          </div>
        </div>
      </div>

      {/* Checkbox */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-900">
          Apply To Existing Services
        </label>

        <label className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
          <input
            type="checkbox"
            checked={overwriteExisting}
            onChange={(event) =>
              setOverwriteExisting(event.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />

          <span className="text-sm font-medium text-slate-700">
            Overwrite existing workflows
          </span>
        </label>
      </div>

      {/* Button */}
      <div>
        <Button
          type="button"
          className="h-14 rounded-2xl bg-slate-900 px-8 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          onClick={() => void handleApplyTemplate()}
          loading={applying}
          disabled={Boolean(rolloutLockedReason)}
        >
          Apply saved workflow
        </Button>
      </div>
    </div>
  </div>
</div>
          {/* Builder List Section */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6 space-y-6">

            {/* Toolbar: Drag Handle Info and Show Required Toggle */}
            <div className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <i className="fas fa-th text-xs" />
                <p className="text-sm">
                  Drag and drop to reorder milestones
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Show required status</span>
                <button
                  type="button"
                  onClick={() => setShowRequiredStatus(!showRequiredStatus)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${showRequiredStatus ? "bg-blue-500" : "bg-slate-200"
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ease-in-out ${showRequiredStatus ? "translate-x-5" : "translate-x-0"
                      }`}
                  />
                </button>
              </div>
            </div>

            {loading ? (
              <LoadingPanel label="Loading default workflow..." />
            ) : error ? (
              <ErrorPanel message={error} onRetry={() => void loadData()} />
            ) : orderedWorkflow.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm border border-slate-100">
                  <i className="fas fa-diagram-project text-xl" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Start The Default Workflow
                </h3>
                <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                  No default sequence has been configured yet. Add the first milestone above to begin shaping the shared service journey.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[800px] space-y-4">
                  {/* Table Header Row */}
                  <div className="grid grid-cols-[80px_2.5fr_1.5fr_1.5fr_1.2fr_1.2fr] gap-4 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <div>#</div>
                    <div>Milestone</div>
                    <div>Type</div>
                    <div>Assigned To</div>
                    <div className="text-center">Required</div>
                    <div className="text-right">Actions</div>
                  </div>

                  {/* Drag and Drop list context */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={orderedWorkflow.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {orderedWorkflow.map((item, index) => {
                          return (
                            <SortableDefaultWorkflowCard
                              key={item.id}
                              item={item}
                              position={index + 1}
                              showRequired={showRequiredStatus}
                              onToggleRequired={() => handleToggleRequired(item.id)}
                              onDelete={() => handleRemove(item.id)}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            )}

            {/* Bottom Dashed Border Button */}
            <Link
              href="/admin/stages/create"
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-slate-200 bg-white py-4 text-sm font-bold text-blue-600 transition hover:border-blue-300 hover:bg-slate-50/50 shadow-sm"
            >
              <i className="fas fa-plus text-xs" />
              Add New Milestone
            </Link>

          </div>

          {/* Bottom Actions Bar */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-8">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Last saved: Just now
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              {hasDirtyTemplate ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved draft changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  <i className="fas fa-check-circle text-emerald-500 text-sm" />
                  All changes saved
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadData()}
                disabled={!hasDirtyTemplate}
                className="h-10 rounded-2xl border-rose-200 bg-white px-5 text-xs font-bold uppercase tracking-wider text-rose-600 transition hover:bg-rose-50"
              >
                Discard Changes
              </Button>
              <Button
                type="button"
                onClick={() => void handleSaveTemplate()}
                loading={saving}
                className="h-10 rounded-2xl bg-blue-600 px-6 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-700"
              >
                Publish Workflow
              </Button>
            </div>
          </div>

        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

function SortableDefaultWorkflowCard({
  item,
  onDelete,
  onToggleRequired,
  position,
  showRequired,
}: {
  item: AdminDefaultWorkflow;
  onDelete: () => void;
  onToggleRequired: () => void;
  position: number;
  showRequired: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = {
    transform: transform
      ? `translate3d(0px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  const color = item.stage?.color || "#1d4ed8";
  const badgeStyle = {
    backgroundColor: `${color}12`,
    color: color,
    borderColor: `${color}25`,
  };

  const assignedCount = ((Number(item.stage?.id) || 0) % 3) + 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300 group/card"
    >
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: color }}
      />

      <div className="grid grid-cols-[80px_2.5fr_1.5fr_1.5fr_1.2fr_1.2fr] gap-4 px-6 py-4 items-center">

        <div className="pl-1">
          <div
            style={badgeStyle}
            className="flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold shadow-sm"
          >
            {position}
          </div>
        </div>

        <div className="space-y-1 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">
              {item.stage?.name || "Untitled milestone"}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              Default
            </span>
            {showRequired && item.is_required && (
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 border border-emerald-100">
                Required
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Key: <span className="font-medium text-slate-700">{item.stage?.slug || "-"}</span>
          </p>
        </div>

        <div className="flex items-center text-sm text-slate-600">
          <i className="fas fa-layer-group text-slate-400 mr-2" />
          Reusable
        </div>

        <div className="flex items-center text-sm text-slate-600">
          <i className="fas fa-users text-slate-400 mr-2" />
          {assignedCount}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onToggleRequired}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${item.is_required ? "bg-emerald-500" : "bg-slate-200"
              }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition ease-in-out ${item.is_required ? "translate-x-4" : "translate-x-0"
                }`}
            />
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <i className="fas fa-grip-vertical text-xs" />
          </button>

          <Link
            href={`/admin/stages/edit/${item.stage_id}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          >
            <i className="fas fa-pencil-alt text-xs" />
          </Link>

          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
          >
            <i className="fas fa-trash-alt text-xs" />
          </button>
        </div>

      </div>
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 px-6 py-14">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
      </div>
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
      <p className="text-sm font-semibold text-rose-700">{message}</p>
      <Button
        type="button"
        variant="outline"
        className="mt-4 rounded-2xl border-rose-200 bg-white px-4 py-2 text-rose-700"
        onClick={onRetry}
      >
        Retry
      </Button>
    </div>
  );
}
