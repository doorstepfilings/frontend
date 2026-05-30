"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { FormSelect, FormTextarea } from "@/components/ui/form-controls";
import { LifecycleStatusPicker } from "@/components/ui/lifecycle-status-picker";
import { Modal } from "@/components/ui/modal";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useConfirm } from "@/hooks/use-confirm";
import {
  updateApplicationStatus,
  overrideApplicationStatus,
  updateDocumentStatus,
  uploadDocument,
  deleteDocument,
  fetchAdminApplicationDetail,
} from "@/lib/features/admin/admin-slice";
import {
  isClientDocument,
  isInternalDocument,
} from "@/lib/utils/document-helpers";
import { parseApiError } from "@/lib/utils/error-parser";
import { adminApi } from "@/lib/api/admin-api";
import {
  buildLifecycleStatusGroups,
  canTransitionLifecycleStatus,
  filterLifecycleStatusOptions,
  normalizeSharedLifecycleStage,
  resolveInitialLifecycleStatusSelection,
  type SharedLifecycleStage,
  type WorkflowStage,
  type TimelineStage,
  normalizeWorkflowStage as normalizeStage,
  attachTimelineMetadata,
} from "@/lib/workflows/lifecycle-status";
import { MilestoneTimeline } from "@/components/ui/milestone-timeline";
import { RequestDocumentList } from "@/components/ui/request-document-list";

interface StatusManagementProps {
  application: any;
}

const ADMIN_DEFAULT_LIFECYCLE_STATUSES = [
  "applied",
  "under_review",
  "in_progress",
  "submitted_to_ca",
  "approved",
];

const ADMIN_SPECIAL_LIFECYCLE_STATUSES = [
  "update_required",
  "rejected",
];

const ADMIN_OVERRIDE_OPTIONS = [
  { value: "in_cart", label: "In Cart" },
  { value: "pending", label: "Pending Review" },
  { value: "applied", label: "Initial Submission" },
  { value: "under_review", label: "Under Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "submitted_to_ca", label: "Department Submission" },
  { value: "update_required", label: "Update Required" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

export const StatusManagement = ({ application }: StatusManagementProps) => {
  const dispatch = useAppDispatch();
  const { actionLoading } = useAppSelector((state) => state.admin);
  const { confirm, ConfirmDialog } = useConfirm();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);

  const [lifecycleStages, setLifecycleStages] = useState<SharedLifecycleStage[]>(
    [],
  );
  const [lifecycleStagesLoading, setLifecycleStagesLoading] = useState(false);

  const [statusForm, setStatusForm] = useState({
    status: "",
    ca_notes: "",
    update_note: "",
    rejection_reason: "",
  });

  const [overrideForm, setOverrideForm] = useState({
    status: application?.status || "",
  });

  const [stageForm, setStageForm] = useState({
    service_workflow_id: "",
    client_message: "",
  });
  const [savingStage, setSavingStage] = useState(false);



  const openStatusModal = () => {
    const visibleStatuses = [
      ...ADMIN_DEFAULT_LIFECYCLE_STATUSES,
      ...ADMIN_SPECIAL_LIFECYCLE_STATUSES,
    ];

    setStatusForm({
      status: resolveInitialLifecycleStatusSelection(
        application?.status,
        visibleStatuses,
      ),
      ca_notes: "",
      update_note: "",
      rejection_reason: "",
    });
    setShowStatusModal(true);
  };

  useEffect(() => {
    if (!showStatusModal) {
      return;
    }

    let isMounted = true;

    async function loadLifecycleStages() {
      setLifecycleStagesLoading(true);

      try {
        const response = await adminApi.getLifecycleStages();
        const payload = response.data?.data ?? response.data;

        if (!isMounted) {
          return;
        }

        setLifecycleStages(
          Array.isArray(payload)
            ? payload.map(normalizeSharedLifecycleStage)
            : [],
        );
      } catch (requestError) {
        if (isMounted) {
          toast.error(parseApiError(requestError));
        }
      } finally {
        if (isMounted) {
          setLifecycleStagesLoading(false);
        }
      }
    }

    void loadLifecycleStages();

    return () => {
      isMounted = false;
    };
  }, [showStatusModal]);

  const openOverrideModal = () => {
    setOverrideForm({
      status: application?.status || "",
    });
    setShowOverrideModal(true);
  };

  const openStageModal = () => {
    setStageForm({
      service_workflow_id:
        application?.current_service_workflow_id !== null &&
          application?.current_service_workflow_id !== undefined
          ? String(application.current_service_workflow_id)
          : "",
      client_message: application?.client_message || "",
    });
    setShowStageModal(true);
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusForm.status) return toast.error("Please select a target status");
    if (!canTransitionLifecycleStatus(application?.status, statusForm.status)) {
      return toast.error(
        `Invalid status transition from ${application?.status} to ${statusForm.status}`,
      );
    }

    const resultAction = await dispatch(
      updateApplicationStatus({ id: application.id, ...statusForm }),
    );
    if (updateApplicationStatus.fulfilled.match(resultAction)) {
      toast.success("Workflow recalibrated successfully");
      setShowStatusModal(false);
      dispatch(fetchAdminApplicationDetail(String(application.id)));
    } else {
      toast.error(parseApiError(resultAction.payload));
    }
  };

  const handleOverrideStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    const resultAction = await dispatch(
      overrideApplicationStatus({ id: application.id, ...overrideForm }),
    );
    if (overrideApplicationStatus.fulfilled.match(resultAction)) {
      toast.success("Lifecycle override applied");
      setShowOverrideModal(false);
      dispatch(fetchAdminApplicationDetail(String(application.id)));
    } else {
      toast.error(parseApiError(resultAction.payload));
    }
  };

  const handleStageUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStage(true);

    try {
      await adminApi.updateApplicationStage(application.id, {
        service_workflow_id: stageForm.service_workflow_id
          ? Number(stageForm.service_workflow_id)
          : null,
        client_message: stageForm.client_message.trim() || null,
      });
      toast.success("Milestone updated");
      setShowStageModal(false);
      dispatch(fetchAdminApplicationDetail(String(application.id)));
    } catch (requestError) {
      toast.error(parseApiError(requestError));
    } finally {
      setSavingStage(false);
    }
  };

  const handleDeleteDoc = async (docId: string | number) => {
    const isConfirmed = await confirm({
      title: "Purge Artifact",
      message: "Are you sure you want to permanently delete this document?",
    });

    if (isConfirmed) {
      const resultAction = await dispatch(
        deleteDocument({ applicationId: application.id, docId }),
      );
      if (deleteDocument.fulfilled.match(resultAction)) {
        toast.success("Artifact purged");
        dispatch(fetchAdminApplicationDetail(String(application.id)));
      } else {
        toast.error(parseApiError(resultAction.payload));
      }
    }
  };
  const applicationProgress = application?.progress;

  const orderedStages = useMemo(
    () =>
      Array.isArray(applicationProgress?.stages)
        ? [...applicationProgress.stages]
          .map(normalizeStage)
          .sort(
            (left, right) =>
              Number(left.order_index) - Number(right.order_index) ||
              Number(left.id) - Number(right.id),
          )
        : [],
    [applicationProgress],
  );
  const hasCustomStages =
    applicationProgress?.mode === "custom" && orderedStages.length > 0;
  const currentStageId = Number(
    application?.current_service_workflow_id ??
    applicationProgress?.current_stage?.id ??
    0,
  );
  const currentStage =
    orderedStages.find((stage) => stage.id === currentStageId) ||
    (applicationProgress?.current_stage
      ? normalizeStage(applicationProgress.current_stage)
      : null);
  const currentOrderIndex =
    currentStage && Number.isFinite(Number(currentStage.order_index))
      ? Number(currentStage.order_index)
      : null;
  const progressPercent =
    applicationProgress?.mode === "custom"
      ? Number(applicationProgress.percent || 0)
      : 0;
  const selectableStages = orderedStages.filter(
    (stage) => stage.is_active || stage.id === currentStageId,
  );
  const stageSummary =
    orderedStages.length > 0
      ? orderedStages.map((stage) => `${stage.order_index}. ${stage.name}`).join(" -> ")
      : "";
  const availableLifecycleStatuses = useMemo(
    () =>
      filterLifecycleStatusOptions({
        currentStatus: application?.status,
        selectedStatus: statusForm.status,
        defaultStatuses: ADMIN_DEFAULT_LIFECYCLE_STATUSES,
        specialStatuses: ADMIN_SPECIAL_LIFECYCLE_STATUSES,
      }),
    [application?.status, statusForm.status],
  );
  const lifecycleStatusGroups = useMemo(
    () =>
      buildLifecycleStatusGroups({
        defaultStages: lifecycleStages,
        defaultStatuses: availableLifecycleStatuses.defaultStatuses,
        specialStatuses: availableLifecycleStatuses.specialStatuses,
      }),
    [availableLifecycleStatuses, lifecycleStages],
  );

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-slate-900 p-8 text-white shadow-xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight">
              Service Milestones And Lifecycle
            </h3>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Management
            </p>
          </div>
          <StatusIndicator status={application.status} size="lg" />
        </div>

        <MilestoneTimeline
          timelineStages={orderedStages.map((stage, index) => ({
            ...stage,
            timeline_index: index + 1,
            timeline_key: `${stage.id}-${index}`,
          }))}
          currentWorkflowStage={currentStage}
          currentWorkflowOrder={currentOrderIndex}
          workflowTrackFill={progressPercent / 100}
          clientMessage={application.client_message}
          hasCustomWorkflow={hasCustomStages}
          status={application.status}
        />

        <div className="flex flex-col gap-3">
          {hasCustomStages ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                Service Milestones
              </p>
              <button
                type="button"
                onClick={openStageModal}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-xs font-bold uppercase tracking-wider text-slate-950 transition-all shadow-lg hover:bg-emerald-400"
              >
                <i className="fas fa-route"></i>
                Update Milestone
              </button>
            </div>
          ) : null}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-950/30 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Global Lifecycle Status
            </p>
            <button
              type="button"
              onClick={openStatusModal}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:bg-blue-500"
            >
              <i className="fas fa-sync-alt"></i>
              Update Lifecycle Status
            </button>
            <button
              type="button"
              onClick={openOverrideModal}
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-all hover:text-white"
            >
              <i className="fas fa-shield-alt"></i>
              Emergency Override
            </button>
          </div>
        </div>
      </div>

      <RequestDocumentList
        documents={application.request_documents || []}
        role="admin"
        userId={application.user?.id}
        onDeleteDocument={handleDeleteDoc}
        onUpdateDocumentStatus={async (doc, status, notes) => {
          const resultAction = await dispatch(
            updateDocumentStatus({
              applicationId: application.id,
              docId: doc.id,
              status,
              remark: notes,
            }),
          );
          if (updateDocumentStatus.fulfilled.match(resultAction)) {
            toast.success("Artifact status updated");
            dispatch(fetchAdminApplicationDetail(String(application.id)));
          } else {
            toast.error(parseApiError(resultAction.payload));
          }
        }}
        onUploadDocument={async (file, docType, notes) => {
          const resultAction = await dispatch(
            uploadDocument({
              applicationId: application.id,
              document: file,
              document_type: docType,
              notes,
            }),
          );
          if (uploadDocument.fulfilled.match(resultAction)) {
            toast.success("Artifact archived successfully");
            dispatch(fetchAdminApplicationDetail(String(application.id)));
          } else {
            toast.error(parseApiError(resultAction.payload));
          }
        }}
        actionLoading={actionLoading}
      />

      <ConfirmDialog />

      <Modal
        isOpen={showStageModal}
        onClose={() => setShowStageModal(false)}
        title="Update Service Milestone"
      >
        <form onSubmit={handleStageUpdate} className="space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
              This Service Only
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Changing this milestone updates progress for this service request.
              It does not change the global lifecycle shared by all services.
            </p>
          </div>
          <FormSelect
            label="Target Milestone"
            value={stageForm.service_workflow_id}
            onChange={(e) =>
              setStageForm({
                ...stageForm,
                service_workflow_id: e.target.value,
              })
            }
            placeholder="Clear current milestone"
            options={selectableStages.map((stage) => ({
              value: stage.id,
              label: `${stage.order_index}. ${stage.name}${stage.is_required ? " (Required)" : " (Optional)"
                }`,
            }))}
            helpText={stageSummary || null}
          />
          <FormTextarea
            label="Client Message"
            value={stageForm.client_message}
            onChange={(e) =>
              setStageForm({
                ...stageForm,
                client_message: e.target.value,
              })
            }
            placeholder="Optional progress note visible in client communication."
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl"
              onClick={() => setShowStageModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 flex-1 rounded-xl bg-emerald-500 text-slate-950 shadow-lg hover:bg-emerald-400"
              loading={savingStage}
            >
              Save Milestone
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Lifecycle Status"
        size="lg"
      >
        <form onSubmit={handleStatusUpdate} className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#eff6ff,white)] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                  Shared Across All Services
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                  These actions update the common application lifecycle. Use
                  the milestone action above when you want service-specific
                  stage progress instead.
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Current Lifecycle
                </p>
                <div className="mt-2">
                  <StatusIndicator status={application.status} />
                </div>
              </div>
            </div>
          </div>

          <LifecycleStatusPicker
            label="Lifecycle Status"
            value={statusForm.status}
            onChange={(value) => setStatusForm({ ...statusForm, status: value })}
            groups={lifecycleStatusGroups}
            loading={lifecycleStagesLoading}
            helpText="Shared default milestones stay in sync with the milestone library. Special actions remain manual."
          />
          {statusForm.status === "update_required" && (
            <FormTextarea
              label="Update Message (Visible to Client)"
              required
              value={statusForm.update_note}
              onChange={(e) =>
                setStatusForm({
                  ...statusForm,
                  update_note: e.target.value,
                })
              }
              placeholder="Explain what needs to be updated..."
            />
          )}
          {statusForm.status === "rejected" && (
            <FormTextarea
              label="Reason for Rejection (Visible to Client)"
              required
              value={statusForm.rejection_reason}
              onChange={(e) =>
                setStatusForm({
                  ...statusForm,
                  rejection_reason: e.target.value,
                })
              }
              placeholder="Provide grounds for rejection..."
            />
          )}
          <FormTextarea
            label="Internal Notes (Private)"
            value={statusForm.ca_notes}
            onChange={(e) =>
              setStatusForm({ ...statusForm, ca_notes: e.target.value })
            }
            placeholder="Notes for the team..."
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-2xl"
              onClick={() => setShowStatusModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-12 flex-1 rounded-2xl bg-slate-900 text-white shadow-lg hover:bg-blue-600"
              loading={actionLoading}
            >
              Apply Lifecycle Change
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        title="Emergency Lifecycle Override"
      >
        <form onSubmit={handleOverrideStatus} className="space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
              Use Carefully
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Override changes the shared lifecycle state. It is separate from
              the service-specific milestones.
            </p>
          </div>
          <FormSelect
            label="Override Lifecycle Status"
            value={overrideForm.status}
            onChange={(e) =>
              setOverrideForm({ ...overrideForm, status: e.target.value })
            }
            options={ADMIN_OVERRIDE_OPTIONS}
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl"
              onClick={() => setShowOverrideModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 flex-1 rounded-xl bg-slate-900 shadow-lg"
              loading={actionLoading}
            >
              Force Update
            </Button>
          </div>
        </form>
      </Modal>


    </div>
  );
};
