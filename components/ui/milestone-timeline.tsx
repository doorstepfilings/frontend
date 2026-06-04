"use client";

import { useMemo } from "react";
import {
  type WorkflowStage,
  type TimelineStage,
  stageIdentityMatches,
  getWorkflowStageLabel,
} from "@/lib/workflows/lifecycle-status";

interface MilestoneTimelineProps {
  timelineStages: TimelineStage[];
  currentWorkflowStage: WorkflowStage | null;
  currentWorkflowOrder: number | null;
  workflowTrackFill: number;
  clientMessage?: string | null;
  hasCustomWorkflow: boolean;
  status?: string;
  stepIndex?: number;
  steps?: string[];
  statusLabels?: Record<string, string>;
  completedAt?: string | null;
}

type DisplayStage = {
  badge: string;
  index: number;
  isCompleted: boolean;
  isCurrent: boolean;
  key: string;
  label: string;
};

function clampFill(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function normalizeLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function MilestoneTimeline({
  timelineStages,
  currentWorkflowStage,
  currentWorkflowOrder,
  workflowTrackFill,
  clientMessage,
  hasCustomWorkflow,
  status = "applied",
  stepIndex = 0,
  steps = [
    "applied",
    "under_review",
    "in_progress",
    "submitted_to_ca",
    "completed",
  ],
  statusLabels = {},
  completedAt = null,
}: MilestoneTimelineProps) {
  const systemTrackFill = useMemo(() => {
    if (steps.length <= 1) {
      return 0;
    }

    return stepIndex / (steps.length - 1);
  }, [stepIndex, steps]);

  const displayStages = useMemo<DisplayStage[]>(() => {
    if (hasCustomWorkflow) {
      return timelineStages.map((stage) => {
        const isCurrent =
          currentWorkflowStage !== null &&
          stageIdentityMatches(stage, currentWorkflowStage);
        const isCompleted =
          currentWorkflowOrder !== null &&
          stage.timeline_index < currentWorkflowOrder;

        return {
          badge: isCurrent ? "Current" : isCompleted ? "Completed" : "Pending",
          index: stage.timeline_index,
          isCompleted,
          isCurrent,
          key: stage.timeline_key,
          label: getWorkflowStageLabel(stage, stage.timeline_index),
        };
      });
    }

    return steps.map((stepKey, index) => ({
      badge:
        index === stepIndex
          ? "Current"
          : index < stepIndex
            ? "Completed"
            : "Pending",
      index: index + 1,
      isCompleted: index < stepIndex,
      isCurrent: index === stepIndex,
      key: stepKey,
      label: statusLabels[stepKey] || normalizeLabel(stepKey),
    }));
  }, [
    currentWorkflowOrder,
    currentWorkflowStage,
    hasCustomWorkflow,
    statusLabels,
    stepIndex,
    steps,
    timelineStages,
  ]);

  const progressFill = clampFill(
    hasCustomWorkflow ? workflowTrackFill : systemTrackFill,
  );
  const progressPercent = Math.round(progressFill * 100);
  const isWorkflowFullyComplete =
    progressPercent >= 100 || status === "completed" || status === "approved";

  const updatedDisplayStages = displayStages.map((stage, i) => {
    // If the workflow is 100% done, make sure the final stage is marked as completed
    if (isWorkflowFullyComplete && i === displayStages.length - 1) {
      return {
        ...stage,
        isCompleted: true,
        isCurrent: false,
        badge: "Completed",
      };
    }
    return stage;
  });

  const currentDisplayStage =
    updatedDisplayStages.find((stage) => stage.isCurrent) ??
    [...updatedDisplayStages].reverse().find((stage) => stage.isCompleted) ??
    updatedDisplayStages[0] ??
    null;
  const currentStagePosition = currentDisplayStage
    ? updatedDisplayStages.findIndex(
        (stage) => stage.key === currentDisplayStage.key,
      ) + 1
    : 1;
  if (updatedDisplayStages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <div className="">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              {isWorkflowFullyComplete
                ? "Final Milestone"
                : "Current Milestone"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="text-lg font-bold tracking-tight text-slate-950">
                {currentDisplayStage?.label ?? "Milestone"}
              </p>
              {isWorkflowFullyComplete && completedAt ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                  <i className="fas fa-check-circle mr-1" /> {completedAt}
                </span>
              ) : null}
            </div>
          </div>

          <div className="w-full lg:text-right">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 lg:justify-end lg:gap-3">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Step {Math.max(currentStagePosition, 1)} of{" "}
              {updatedDisplayStages.length}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:hidden">
        {updatedDisplayStages.map((stage, index) => {
          const nodeClasses = stage.isCurrent
            ? "border-slate-900 bg-slate-900 text-white"
            : stage.isCompleted
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-slate-200 bg-white text-slate-500";
          const cardClasses = stage.isCurrent
            ? "border-slate-900 bg-slate-50 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
            : stage.isCompleted
              ? "border-emerald-200 bg-emerald-50"
              : "border-slate-200 bg-white";
          const badgeClasses = stage.isCurrent
            ? "border-slate-900 text-slate-900"
            : stage.isCompleted
              ? "border-emerald-200 text-emerald-700"
              : "border-slate-200 text-slate-500";

          return (
            <div key={stage.key} className="space-y-3">
              <div className={`rounded-2xl border p-4 ${cardClasses}`}>
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${nodeClasses}`}
                  >
                    {stage.isCompleted ? (
                      <i className="fas fa-check text-xs" />
                    ) : (
                      stage.index
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {stage.label}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full border bg-white px-2.5 py-1 text-[10px] font-semibold ${badgeClasses}`}
                      >
                        {stage.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Step {index + 1} of {updatedDisplayStages.length}
                    </p>
                  </div>
                </div>
              </div>

              {index < updatedDisplayStages.length - 1 ? (
                <div className="flex justify-center">
                  <div className="h-4 w-px rounded-full bg-slate-200" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-[1.75rem] border border-slate-200 bg-white px-4 py-6 sm:block">
        <div
          className="relative mx-auto min-w-[36rem] px-2"
          style={{
            minWidth: `${Math.max(updatedDisplayStages.length * 8, 36)}rem`,
          }}
        >
          <div className="absolute left-8 right-8 top-6 h-[2px] rounded-full bg-slate-200" />
          <div
            className="absolute left-8 top-6 h-[2px] rounded-full transition-all duration-700 ease-out"
            style={{
              background: "#059669",
              width:
                updatedDisplayStages.length <= 1
                  ? "0%"
                  : `calc((100% - 4rem) * ${progressFill})`,
            }}
          />

          <div
            className="relative z-10 grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${updatedDisplayStages.length}, minmax(6.5rem, 1fr))`,
            }}
          >
            {updatedDisplayStages.map((stage) => {
              const nodeClasses = stage.isCurrent
                ? "border-slate-900 bg-white text-slate-900 shadow-[0_0_0_4px_rgba(15,23,42,0.08)]"
                : stage.isCompleted
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-300 bg-white text-slate-400";
              const badgeClasses = stage.isCurrent
                ? "border-slate-900 text-slate-900"
                : stage.isCompleted
                  ? "border-emerald-200 text-emerald-700"
                  : "border-slate-200 text-slate-500";

              return (
                <div
                  key={stage.key}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border text-sm font-bold transition-all duration-300 ${nodeClasses}`}
                  >
                    {stage.isCompleted ? (
                      <i className="fas fa-check text-sm" />
                    ) : (
                      stage.index
                    )}
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <p className="text-sm font-semibold text-slate-900">
                      {stage.label}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full border bg-white px-2.5 py-1 text-[10px] font-semibold ${badgeClasses}`}
                    >
                      {stage.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {clientMessage ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Client Message
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
            {clientMessage}
          </p>
        </div>
      ) : null}
    </div>
  );
}
