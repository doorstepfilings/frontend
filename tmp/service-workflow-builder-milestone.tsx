"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
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
import { toast } from "react-hot-toast";
import {
  adminApi,
  type AdminServiceWorkflow,
  type AdminStage,
} from "@/lib/api/admin-api";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/core/form-field";
import { SearchSelect } from "@/components/ui/core/search-select";
import { useConfirm } from "@/hooks/use-confirm";
import { parseApiError } from "@/lib/utils/error-parser";
import { PanelLogoLoader } from "@/components/ui/logo-loader";

const PANEL_CLASS = "rounded-3xl border border-slate-200 bg-white shadow-sm";
const INPUT_CLASS =
  "w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const KICKER_CLASS =
  "text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400";
const TITLE_CLASS = "text-2xl font-bold tracking-tight text-slate-900";

type ServiceWorkflowBuilderProps = {
  serviceId: number | null;
  variant?: "card" | "embedded";
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

function normalizeWorkflow(workflow: unknown): AdminServiceWorkflow {
  const source = (workflow ?? {}) as ApiRecord;

  return {
    id: Number(source.id ?? 0),
    service_id: Number(source.service_id ?? source.serviceId ?? 0),
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

export function ServiceWorkflowBuilder({
  serviceId,
  variant = "card",
}: ServiceWorkflowBuilderProps) {
  const { confirm, ConfirmDialog } = useConfirm();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const [stages, setStages] = useState<AdminStage[]>([]);
  const [workflows, setWorkflows] = useState<AdminServiceWorkflow[]>([]);
  const [loadedServiceId, setLoadedServiceId] = useState<number | null>(null);
  const [syncedOrderIds, setSyncedOrderIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appendStageId, setAppendStageId] = useState("");
  const [slotSelections, setSlotSelections] = useState<Record<string, string>>(
    {},
  );
  const [openInsertSlot, setOpenInsertSlot] = useState<string | null>(null);
  const [assigningSlot, setAssigningSlot] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [updatingWorkflowId, setUpdatingWorkflowId] = useState<number | null>(
    null,
  );
  const [deletingWorkflowId, setDeletingWorkflowId] = useState<number | null>(
    null,
  );
  const [createModalTarget, setCreateModalTarget] = useState<string | null>(null);
  const orderSaveRequestIdRef = useRef(0);

  const orderedWorkflows = useMemo(
    () =>
      [...workflows].sort(
        (left, right) =>
          Number(left.position) - Number(right.position) ||
          Number(left.id) - Number(right.id),
      ),
    [workflows],
  );

  const assignedStageIds = useMemo(
    () => new Set(orderedWorkflows.map((workflow) => Number(workflow.stage_id))),
    [orderedWorkflows],
  );

  const availableStages = useMemo(
    () =>
      stages.filter(
        (stage) => stage.is_active && !assignedStageIds.has(Number(stage.id)),
      ),
    [assignedStageIds, stages],
  );

  const isInitialLoadPending =
    serviceId !== null && loadedServiceId !== serviceId && !error;
  const isOrderDirty =
    orderedWorkflows.map((workflow) => workflow.id).join(",") !==
    syncedOrderIds.join(",");
  const containerClassName =
    variant === "embedded"
      ? "rounded-[1.75rem] border border-slate-200/80 bg-slate-50/80"
      : PANEL_CLASS;

  async function loadWorkflowData(targetServiceId: number) {
    setLoading(true);

    try {
      const [stagesResponse, workflowsResponse] = await Promise.all([
        adminApi.getStages(),
        adminApi.getServiceWorkflows(targetServiceId),
      ]);

      const nextStages = unwrapApiData<ApiRecord[]>(stagesResponse.data);
      const nextWorkflows = unwrapApiData<ApiRecord[]>(workflowsResponse.data);
      const normalizedStages = Array.isArray(nextStages)
        ? nextStages.map(normalizeStage)
        : [];
      const normalizedWorkflows = Array.isArray(nextWorkflows)
        ? nextWorkflows.map(normalizeWorkflow)
        : [];

      setStages(normalizedStages);
      setWorkflows(normalizedWorkflows);
      setSyncedOrderIds(normalizedWorkflows.map((workflow) => workflow.id));
      setLoadedServiceId(targetServiceId);
      setError(null);
    } catch (requestError) {
      setError(parseApiError(requestError));
      setLoadedServiceId(targetServiceId);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!serviceId) {
      return;
    }

    const targetServiceId = serviceId;
    let isMounted = true;

    async function loadInitialWorkflowData() {
      setLoading(true);

      try {
        const [stagesResponse, workflowsResponse] = await Promise.all([
          adminApi.getStages(),
          adminApi.getServiceWorkflows(targetServiceId),
        ]);

        const nextStages = unwrapApiData<ApiRecord[]>(stagesResponse.data);
        const nextWorkflows = unwrapApiData<ApiRecord[]>(workflowsResponse.data);
        const normalizedStages = Array.isArray(nextStages)
          ? nextStages.map(normalizeStage)
          : [];
        const normalizedWorkflows = Array.isArray(nextWorkflows)
          ? nextWorkflows.map(normalizeWorkflow)
          : [];

        if (!isMounted) {
          return;
        }

        setStages(normalizedStages);
        setWorkflows(normalizedWorkflows);
        setSyncedOrderIds(normalizedWorkflows.map((workflow) => workflow.id));
        setLoadedServiceId(targetServiceId);
        setError(null);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(parseApiError(requestError));
        setLoadedServiceId(targetServiceId);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadInitialWorkflowData();

    return () => {
      isMounted = false;
    };
  }, [serviceId]);

  async function handleAssignStage(stageIdValue: string, position: number, slotKey: string) {
    if (!serviceId) {
      return;
    }

    const stageId = Number(stageIdValue);
    if (!Number.isInteger(stageId) || stageId <= 0) {
      toast.error("Please choose a milestone first");
      return;
    }

    setAssigningSlot(slotKey);
    try {
      await adminApi.assignWorkflowStage({
        serviceId,
        stageId,
        position,
        isRequired: true,
      });
      toast.success("Milestone added to this service");
      setAppendStageId("");
      setSlotSelections((current) => ({
        ...current,
        [slotKey]: "",
      }));
      setOpenInsertSlot((current) => (current === slotKey ? null : current));
      await loadWorkflowData(serviceId);
    } catch (requestError) {
      toast.error(parseApiError(requestError));
    } finally {
      setAssigningSlot(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!serviceId || !over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedWorkflows.findIndex(
      (workflow) => workflow.id === Number(active.id),
    );
    const newIndex = orderedWorkflows.findIndex(
      (workflow) => workflow.id === Number(over.id),
    );

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextOrder = arrayMove(orderedWorkflows, oldIndex, newIndex).map(
      (workflow, index) => ({
        ...workflow,
        position: index + 1,
      }),
    );
    setWorkflows(nextOrder);
    void persistWorkflowOrder(serviceId, nextOrder);
  }

  async function persistWorkflowOrder(
    targetServiceId: number,
    nextOrder: AdminServiceWorkflow[],
  ) {
    const requestId = orderSaveRequestIdRef.current + 1;
    orderSaveRequestIdRef.current = requestId;
    setSavingOrder(true);

    try {
      await adminApi.reorderServiceWorkflows({
        serviceId: targetServiceId,
        orderedWorkflowIds: nextOrder.map((workflow) => workflow.id),
      });

      if (orderSaveRequestIdRef.current !== requestId) {
        return;
      }

      setSyncedOrderIds(nextOrder.map((workflow) => workflow.id));
    } catch (requestError) {
      if (orderSaveRequestIdRef.current !== requestId) {
        return;
      }

      toast.error(parseApiError(requestError));
      await loadWorkflowData(targetServiceId);
    } finally {
      if (orderSaveRequestIdRef.current === requestId) {
        setSavingOrder(false);
      }
    }
  }

  async function handleToggleRequired(workflow: AdminServiceWorkflow) {
    if (!serviceId) {
      return;
    }

    setUpdatingWorkflowId(workflow.id);
    try {
      await adminApi.updateWorkflowStage(workflow.id, {
        isRequired: !workflow.is_required,
      });
      toast.success("Milestone requirement updated");
      await loadWorkflowData(serviceId);
    } catch (requestError) {
      toast.error(parseApiError(requestError));
    } finally {
      setUpdatingWorkflowId(null);
    }
  }

  async function handleDeleteWorkflow(workflow: AdminServiceWorkflow) {
    if (!serviceId) {
      return;
    }

    const isConfirmed = await confirm({
      title: "Remove milestone",
      message: `Remove "${workflow.stage?.name || "this milestone"}" from this service?`,
      confirmLabel: "Remove milestone",
      variant: "danger",
    });

    if (!isConfirmed) {
      return;
    }

    setDeletingWorkflowId(workflow.id);
    try {
      await adminApi.deleteWorkflowStage(workflow.id);
      toast.success("Milestone removed");
      await loadWorkflowData(serviceId);
    } catch (requestError) {
      toast.error(parseApiError(requestError));
    } finally {
      setDeletingWorkflowId(null);
    }
  }

  if (!serviceId) {
    return (
      <div className={`${containerClassName} p-6 sm:p-8`}>
        <p className={KICKER_CLASS}>Milestone Builder</p>
        <h2 className={`mt-2 ${TITLE_CLASS}`}>Service Milestones</h2>
      </div>
    );
  }

  return (
    <div className={`${containerClassName} p-6 sm:p-8`}>
      <ConfirmDialog />
      <CreateStageModal
        key={createModalTarget ?? "closed"}
        isOpen={createModalTarget !== null}
        onClose={() => setCreateModalTarget(null)}
        onSuccess={async (newStageId) => {
          await loadWorkflowData(serviceId);
          if (createModalTarget === "append") {
            setAppendStageId(newStageId);
          } else if (createModalTarget) {
            setSlotSelections((current) => ({
              ...current,
              [createModalTarget]: newStageId,
            }));
          }
        }}
      />

      <div className="mb-8 space-y-2">
        <p className={KICKER_CLASS}>Milestone Builder</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className={TITLE_CLASS}>Service Milestones</h2>
            <p className="text-sm font-medium text-slate-500">
              {savingOrder
                ? "Saving milestone order..."
                : isOrderDirty
                  ? "Milestone order has unsaved changes..."
                  : "Milestone order autosaves after drag and drop."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/stages"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
            >
              Milestone Library
            </Link>
            <Link
              href="/admin/stages"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
            >
              Manage Milestones
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
          <FormField
            label={orderedWorkflows.length === 0 ? "Add First Milestone" : "Append Milestone"}
            className="flex-1"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <SearchSelect
                options={[
                  { value: "", label: "Select a reusable milestone..." },
                  ...availableStages.map((stage) => ({
                    value: String(stage.id),
                    label: stage.name,
                  })),
                ]}
                value={appendStageId}
                onChange={setAppendStageId}
                searchable={availableStages.length > 6}
                treatEmptyValueAsPlaceholder
                triggerClassName={`${INPUT_CLASS} min-h-[3rem] flex-1`}
                valueLabelClassName="text-sm font-medium text-slate-900"
                handleClassName="h-8 w-8 rounded-lg border-0 bg-transparent text-slate-400"
              />
              <button
                type="button"
                className="flex h-12 w-full shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 sm:w-auto"
                onClick={() => setCreateModalTarget("append")}
                title="Create New Milestone"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </FormField>

          <div className="flex flex-col">
            <Button
              type="button"
              className="jsx-1954957fa388241e admin-btn h-12 min-w-[11rem] rounded-2xl text-xs flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() =>
                void handleAssignStage(
                  appendStageId,
                  orderedWorkflows.length + 1,
                  "append",
                )
              }
              loading={assigningSlot === "append"}
              disabled={availableStages.length === 0}
            >
              {orderedWorkflows.length === 0 ? "Build Timeline" : "Add To End"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {loading || isInitialLoadPending ? (
          <PanelLogoLoader
            className="min-h-[16rem] rounded-3xl border border-slate-200 bg-slate-50 px-0 py-0"
            label="Loading milestones..."
            size={54}
            surfaceClassName="max-w-md"
          />
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
            <p className="text-sm font-semibold text-rose-700">{error}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 rounded-2xl border-rose-200 bg-white px-4 py-2 text-rose-700"
              onClick={() => void loadWorkflowData(serviceId)}
            >
              Retry
            </Button>
          </div>
        ) : orderedWorkflows.length === 0 ? null : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedWorkflows.map((workflow) => workflow.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {orderedWorkflows.map((workflow, index) => {
                  const insertKey = `insert-${index + 2}`;

                  return (
                    <SortableWorkflowCard
                      key={workflow.id}
                      workflow={workflow}
                      position={index + 1}
                      busy={
                        updatingWorkflowId === workflow.id ||
                        deletingWorkflowId === workflow.id
                      }
                      insertControl={{
                        slotKey: insertKey,
                        label: "Select milestone to add after this",
                        value: slotSelections[insertKey] ?? "",
                        options: availableStages,
                        loading: assigningSlot === insertKey,
                        open: openInsertSlot === insertKey,
                        onToggle: () =>
                          setOpenInsertSlot((current) =>
                            current === insertKey ? null : insertKey,
                          ),
                        onChange: (value) =>
                          setSlotSelections((current) => ({
                            ...current,
                            [insertKey]: value,
                          })),
                        onCreateNew: () => {
                          setOpenInsertSlot(insertKey);
                          setCreateModalTarget(insertKey);
                        },
                        onSubmit: () =>
                          void handleAssignStage(
                            slotSelections[insertKey] ?? "",
                            index + 2,
                            insertKey,
                          ),
                      }}
                      onToggleRequired={() => void handleToggleRequired(workflow)}
                      onDelete={() => void handleDeleteWorkflow(workflow)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

function InsertStageControl({
  label,
  loading,
  onChange,
  onCreateNew,
  onSubmit,
  options,
  slotKey,
  value,
}: {
  label: string;
  loading: boolean;
  onChange: (value: string) => void;
  onCreateNew: () => void;
  onSubmit: () => void;
  options: AdminStage[];
  slotKey: string;
  value: string;
}) {
  return (
    <div className="flex w-full flex-col gap-2 rounded-2xl border border-blue-100 bg-blue-50/80 p-2 sm:min-w-[260px] sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="w-full sm:min-w-[180px] sm:flex-1">
        <SearchSelect
          options={[
            { value: "", label: `${label}...` },
            ...options.map((stage) => ({
              value: String(stage.id),
              label: stage.name,
            })),
          ]}
          value={value}
          onChange={onChange}
          searchable={options.length > 6}
          treatEmptyValueAsPlaceholder
          triggerClassName="min-h-[2.75rem] rounded-xl bg-white px-3 py-2"
          valueLabelClassName="text-sm font-semibold text-slate-900"
          handleClassName="h-7 w-7 rounded-lg border-0 bg-transparent text-slate-400"
          selectStyle={{
            borderColor: "#dbeafe",
            background: "#ffffff",
            boxShadow: "none",
          }}
        />
      </div>
      <button
        type="button"
        onClick={onCreateNew}
        className="flex h-10 w-full items-center justify-center rounded-xl border border-blue-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100 sm:w-auto"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        New
      </button>
      <button
        type="button"
        className="flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        onClick={onSubmit}
        disabled={loading || !value}
      >
        {loading ? "Saving..." : "Insert"}
      </button>
    </div>
  );
}

type WorkflowInsertControl = {
  label: string;
  loading: boolean;
  onChange: (value: string) => void;
  onCreateNew: () => void;
  onSubmit: () => void;
  onToggle: () => void;
  open: boolean;
  options: AdminStage[];
  slotKey: string;
  value: string;
};

function SortableWorkflowCard({
  workflow,
  position,
  busy,
  insertControl,
  onToggleRequired,
  onDelete,
}: {
  workflow: AdminServiceWorkflow;
  position: number;
  busy: boolean;
  insertControl: WorkflowInsertControl;
  onToggleRequired: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: workflow.id });
  const style = {
    transform: transform
      ? `translate3d(0px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all hover:border-blue-200 hover:shadow-md xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <button
            type="button"
            className="flex h-10 w-full items-center justify-center rounded-xl bg-slate-50 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 sm:w-auto"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
            {position}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900">
              {workflow.stage?.name || "Untitled milestone"}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {workflow.stage?.slug}
            </p>
          </div>

          <div className="hidden w-32 shrink-0 lg:block">
            {workflow.stage?.color ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: workflow.stage.color }}
                />
                Color
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end xl:w-auto xl:max-w-[58%]">
          {insertControl.open ? (
            <InsertStageControl
              slotKey={insertControl.slotKey}
              label={insertControl.label}
              value={insertControl.value}
              options={insertControl.options}
              loading={insertControl.loading}
              onChange={insertControl.onChange}
              onCreateNew={insertControl.onCreateNew}
              onSubmit={insertControl.onSubmit}
            />
          ) : null}

          <button
            type="button"
            onClick={insertControl.onToggle}
            className={`flex h-10 w-full items-center justify-center rounded-xl border px-3 text-[10px] font-black uppercase tracking-widest transition-colors sm:w-auto ${insertControl.open
              ? "border-blue-200 bg-blue-50 text-blue-600"
              : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              }`}
            title={
              insertControl.open
                ? "Hide add milestone"
                : "Add milestone after this"
            }
          >
            {insertControl.open ? (
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {insertControl.open ? "Close" : "Add"}
          </button>

          <button
            type="button"
            onClick={onToggleRequired}
            disabled={busy}
            className={`flex h-10 w-full items-center justify-center rounded-xl border px-4 transition-colors sm:w-auto ${workflow.is_required
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-500"
              } ${busy ? "opacity-60" : ""}`}
            title={workflow.is_required ? "Required Step" : "Optional Step"}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">
              {workflow.is_required ? "Required" : "Optional"}
            </span>
          </button>

          <button
            type="button"
            className="flex h-10 w-full items-center justify-center rounded-xl border border-rose-100 bg-rose-50 px-3 text-[10px] font-black uppercase tracking-widest text-rose-600 transition-colors hover:bg-rose-600 hover:text-white sm:w-auto"
            onClick={onDelete}
            disabled={busy}
            title="Remove milestone"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {busy ? "Removing" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateStageModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (stageId: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a milestone name");
      return;
    }

    setLoading(true);
    try {
      const response = await adminApi.createStage({
        name: name.trim(),
        color,
        isActive: true,
      });
      const newStage = unwrapApiData<{ id: number }>(response.data);
      toast.success("Milestone created successfully");
      onSuccess(String(newStage.id));
      onClose();
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight text-slate-900">
            Create Milestone
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-100 px-2 text-sm font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-900"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              placeholder="e.g. Document Verification"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Color Label
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
              />
              <span className="text-sm font-medium text-slate-600 uppercase">
                {color}
              </span>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            >
              Create Milestone
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
