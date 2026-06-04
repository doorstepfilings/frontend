"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { DetailViewSkeleton } from "@/components/ui/skeletons/detail-view-skeleton";
import { apiClient } from "@/lib/api/client";
import { toast } from "react-hot-toast";

import { FormDataRenderer } from "@/components/ui/form-data-renderer";
import { formatDateWithPattern } from "@/lib/utils/formatters";
import { Modal } from "@/components/ui/modal";
import { FormSelect, FormTextarea } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";
import {
  ACCOUNTANT_DEFAULT_LIFECYCLE_STATUSES,
  type TimelineStage,
  type DefaultWorkflowTemplateItem,
  normalizeWorkflowStage,
  sortWorkflowStages,
  attachTimelineMetadata,
  buildSharedTimelineStages,
  getWorkflowStageLabel,
  stageIdentityMatches,
  parsePositiveNumber,
} from "@/lib/workflows/lifecycle-status";
import { MilestoneTimeline } from "@/components/ui/milestone-timeline";
import { RequestDocumentList } from "@/components/ui/request-document-list";

const DOCUMENT_ARRAY_KEYS = [
  "request_documents",
  "requestDocuments",
  "documents",
];

const SINGLE_DOCUMENT_KEYS = [
  "document",
  "request_document",
  "requestDocument",
];

function getResponsePayload(responseData: any) {
  return (
    responseData?.data?.request ||
    responseData?.request ||
    responseData?.data ||
    responseData
  );
}

function isDocumentLike(value: any) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Boolean(
    value.file_url ||
    value.fileUrl ||
    value.file_path ||
    value.filePath ||
    value.file_name ||
    value.fileName ||
    value.document_name ||
    value.documentName ||
    value.document_type ||
    value.documentType ||
    value.document_category ||
    value.documentCategory,
  );
}

function extractDocumentList(source: any): any[] {
  if (Array.isArray(source)) {
    return source;
  }

  if (!source || typeof source !== "object") {
    return [];
  }

  for (const key of DOCUMENT_ARRAY_KEYS) {
    if (Array.isArray(source[key])) {
      return source[key];
    }
  }

  for (const key of SINGLE_DOCUMENT_KEYS) {
    if (isDocumentLike(source[key])) {
      return [source[key]];
    }
  }

  if (source.data && source.data !== source) {
    return extractDocumentList(source.data);
  }

  return isDocumentLike(source) ? [source] : [];
}

function getDocumentMergeKey(doc: any, index: number) {
  return String(
    doc?.id ??
      doc?.uuid ??
      doc?.file_url ??
      doc?.fileUrl ??
      doc?.file_path ??
      doc?.filePath ??
      doc?.file_name ??
      doc?.fileName ??
      `document-${index}`,
  );
}

function mergeDocumentLists(...documentLists: any[][]) {
  const seen = new Map<string, any>();

  documentLists.flat().forEach((doc, index) => {
    if (!doc || typeof doc !== "object") {
      return;
    }

    const key = getDocumentMergeKey(doc, index);
    seen.set(key, { ...(seen.get(key) || {}), ...doc });
  });

  return Array.from(seen.values());
}

function getRequestDocuments(request: any) {
  if (!request) {
    return [];
  }

  return mergeDocumentLists(
    Array.isArray(request.request_documents) ? request.request_documents : [],
    Array.isArray(request.requestDocuments) ? request.requestDocuments : [],
  );
}

function attachRequestDocuments(request: any, extraDocuments: any[] = []) {
  if (!request || typeof request !== "object") {
    return request;
  }

  const requestDocuments = mergeDocumentLists(
    getRequestDocuments(request),
    extraDocuments,
  );

  return {
    ...request,
    request_documents: requestDocuments,
    requestDocuments: requestDocuments,
  };
}

async function fetchAccountantRequestData(
  requestId: string,
  extraDocuments: any[] = [],
) {
  const [requestRes, documentsRes] = await Promise.all([
    apiClient.get(`/accountant/service-requests/${requestId}`),
    apiClient
      .get(`/accountant/service-requests/${requestId}/documents`)
      .catch(() => null),
  ]);

  const requestPayload = getResponsePayload(requestRes.data);
  const endpointDocuments = extractDocumentList(documentsRes?.data);

  return attachRequestDocuments(
    requestPayload,
    mergeDocumentLists(endpointDocuments, extraDocuments),
  );
}

export function AccountantRequestDetailView() {
  const params = useParams();
  const id = params?.id as string;

  const [req, setReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [defaultWorkflowTemplate, setDefaultWorkflowTemplate] = useState<
    DefaultWorkflowTemplateItem[]
  >([]);
  const [stageForm, setStageForm] = useState({
    service_workflow_id: "",
    client_message: "",
  });
  const [revisionNotes, setRevisionNotes] = useState("");
  const applyRequestState = (payload: any, extraDocuments: any[] = []) => {
    const nextRequest = attachRequestDocuments(payload, extraDocuments);
    setReq(nextRequest);
    return nextRequest;
  };

  const fetchData = async (extraDocuments: any[] = []) => {
    try {
      const nextRequest = await fetchAccountantRequestData(id, extraDocuments);
      applyRequestState(nextRequest);
      return nextRequest;
    } catch {
      toast.error("Failed to synchronize dossier");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      return;
    }

    let isMounted = true;

    async function loadRequest() {
      setLoading(true);
      setReq(null);
      setDefaultWorkflowTemplate([]);

      try {
        const nextRequest = await fetchAccountantRequestData(id);

        if (!isMounted) {
          return;
        }

        applyRequestState(nextRequest);
      } catch {
        if (isMounted) {
          toast.error("Failed to synchronize dossier");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadRequest();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    const hasServiceWorkflow =
      Boolean(req?.has_workflow) ||
      Boolean(req?.progression_control?.has_workflow) ||
      Boolean(req?.current_workflow) ||
      req?.progression_control?.mode === "workflow" ||
      (Array.isArray(req?.workflow_stages) && req.workflow_stages.length > 0) ||
      req?.progress?.mode === "custom";

    if (!req) {
      return;
    }

    if (hasServiceWorkflow) {
      Promise.resolve().then(() => {
        setDefaultWorkflowTemplate([]);
      });
      return;
    }

    let isMounted = true;

    async function loadDefaultWorkflowTemplate() {
      try {
        const response = await apiClient.get("/accountant/workflows/default");
        const payload = response.data?.data ?? response.data;

        if (!isMounted) {
          return;
        }

        setDefaultWorkflowTemplate(
          Array.isArray(payload)
            ? (payload as DefaultWorkflowTemplateItem[])
            : [],
        );
      } catch {
        if (isMounted) {
          setDefaultWorkflowTemplate([]);
        }
      }
    }

    void loadDefaultWorkflowTemplate();

    return () => {
      isMounted = false;
    };
  }, [req]);

  const stepIndex = useMemo(() => {
    if (!req?.status) return 0;
    if (req.status === "update_required" || req.status === "rejected") return 0;
    if (req.status === "approved" || req.status === "completed") return 4;
    const idx = ACCOUNTANT_DEFAULT_LIFECYCLE_STATUSES.indexOf(
      req.status as (typeof ACCOUNTANT_DEFAULT_LIFECYCLE_STATUSES)[number],
    );
    return idx >= 0 ? idx : 0;
  }, [req?.status]);

  const currentStageFromProgress = req?.progress?.current_stage
    ? normalizeWorkflowStage(req.progress.current_stage)
    : null;
  const requestedWorkflowId = parsePositiveNumber(
    req?.current_service_workflow_id,
  );
  const serviceWorkflowStages: TimelineStage[] = (() => {
    const rawStages =
      Array.isArray(req?.workflow_stages) && req.workflow_stages.length > 0
        ? req.workflow_stages
        : Array.isArray(req?.progress?.stages)
          ? req.progress.stages
          : [];
    const normalizedStages = Array.isArray(rawStages)
      ? [...rawStages].map(normalizeWorkflowStage).sort(sortWorkflowStages)
      : [];

    const mergedStages =
      currentStageFromProgress &&
      !normalizedStages.some((stage) =>
        stageIdentityMatches(stage, currentStageFromProgress),
      )
        ? [...normalizedStages, currentStageFromProgress].sort(
            sortWorkflowStages,
          )
        : normalizedStages;

    return attachTimelineMetadata(mergedStages);
  })();
  const sharedWorkflowStages = buildSharedTimelineStages(
    defaultWorkflowTemplate,
    req?.status,
  );
  const hasCustomWorkflow = Boolean(req?.is_custom_workflow);
  const hasServiceSpecificWorkflow =
    Boolean(req?.has_workflow) ||
    Boolean(req?.progression_control?.has_workflow) ||
    Boolean(req?.current_workflow) ||
    req?.progression_control?.mode === "workflow" ||
    serviceWorkflowStages.length > 0;
  const showingSharedWorkflowTemplate =
    !hasServiceSpecificWorkflow && sharedWorkflowStages.length > 0;
  const timelineStages = hasServiceSpecificWorkflow
    ? serviceWorkflowStages
    : showingSharedWorkflowTemplate
      ? sharedWorkflowStages
      : [];
  const currentWorkflowStage =
    timelineStages.find(
      (stage) =>
        stage.is_current ||
        (requestedWorkflowId !== null &&
          parsePositiveNumber(stage.id) === requestedWorkflowId) ||
        stageIdentityMatches(stage, currentStageFromProgress),
    ) ||
    timelineStages[0] ||
    null;
  const currentWorkflowId = !showingSharedWorkflowTemplate
    ? (parsePositiveNumber(currentWorkflowStage?.id) ??
      requestedWorkflowId ??
      0)
    : 0;
  const currentWorkflowOrder =
    currentWorkflowStage &&
    Number.isFinite(
      Number(
        timelineStages.find((stage) =>
          stageIdentityMatches(stage, currentWorkflowStage),
        )?.timeline_index,
      ),
    )
      ? Number(
          timelineStages.find((stage) =>
            stageIdentityMatches(stage, currentWorkflowStage),
          )?.timeline_index,
        )
      : null;
  const workflowStepIndex =
    currentWorkflowOrder && currentWorkflowOrder > 0
      ? currentWorkflowOrder - 1
      : 0;
  const workflowTrackFill =
    timelineStages.length <= 1
      ? 0
      : workflowStepIndex / (timelineStages.length - 1);
  const workflowStageSummary = hasServiceSpecificWorkflow
    ? serviceWorkflowStages
        .map(
          (stage) =>
            `${stage.timeline_index}. ${getWorkflowStageLabel(
              stage,
              stage.timeline_index,
            )}`,
        )
        .join(" -> ")
    : null;
  const selectableWorkflowStages = hasServiceSpecificWorkflow
    ? serviceWorkflowStages.filter(
        (stage) =>
          parsePositiveNumber(stage.id) !== null &&
          (stage.is_active ||
            (!showingSharedWorkflowTemplate &&
              stageIdentityMatches(stage, currentWorkflowStage))),
      )
    : [];
  const normalizedRequestStatus = String(req?.status || "").toLowerCase();
  const isTerminalRequest = [
    "approved",
    "completed",
    "cancelled",
    "rejected",
  ].includes(normalizedRequestStatus);
  const canCompleteRequest = [
    "in_progress",
    "submitted_to_ca",
    "approved",
  ].includes(normalizedRequestStatus);
  const canCancelRequest =
    !isTerminalRequest &&
    [
      "applied",
      "paid",
      "under_review",
      "update_required",
      "in_progress",
      "submitted_to_ca",
    ].includes(normalizedRequestStatus);

  const handleQuickStageUpdate = async (targetStatus: string) => {
    setUpdating(true);
    try {
      await apiClient.patch(`/accountant/service-requests/${id}/stage`, {
        target_status: targetStatus,
      });
      toast.success("Stage updated successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update stage");
    } finally {
      setUpdating(false);
    }
  };

  const openStageModal = () => {
    setStageForm({
      service_workflow_id:
        currentWorkflowId > 0 ? String(currentWorkflowId) : "",
      client_message: req?.client_message || "",
    });
    setShowStageModal(true);
  };

  const handleUpdateWorkflowStage = async (event: React.FormEvent) => {
    event.preventDefault();
    setUpdating(true);

    try {
      await apiClient.patch(`/accountant/service-requests/${id}/stage`, {
        service_workflow_id: stageForm.service_workflow_id
          ? Number(stageForm.service_workflow_id)
          : null,
        client_message: stageForm.client_message.trim() || null,
      });
      toast.success("Milestone updated");
      setShowStageModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update milestone",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleRevisionSubmit = async () => {
    if (!revisionNotes.trim())
      return toast.error("Description of updates is mandatory");
    setUpdating(true);
    try {
      await apiClient.post(`/accountant/service-requests/${id}/revision`, {
        notes: revisionNotes,
      });
      toast.success("Revision committed to review");
      setRevisionNotes("");
      fetchData();
    } catch {
      toast.error("Revision commit failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteDoc = async (docId: string | number) => {
    try {
      await apiClient.delete(
        `/accountant/service-requests/${id}/documents/${docId}`,
      );
      toast.success("Artifact purged from archives");
      fetchData();
    } catch {
      toast.error("Purge failed");
    }
  };

  const handleUpdateDocStatus = async (
    doc: any,
    status: string,
    notes?: string,
  ) => {
    try {
      await apiClient.patch(
        `/accountant/service-requests/${id}/documents/${doc.id}/status`,
        { status, notes },
      );
      toast.success("Artifact status updated");
      fetchData();
    } catch {
      toast.error("Status update failed");
    }
  };

  const handleCopyApplicationId = async () => {
    const applicationLabel = String(
      req?.application_unique_id || req?.id || "",
    ).trim();

    if (
      !applicationLabel ||
      typeof navigator === "undefined" ||
      !navigator.clipboard
    ) {
      toast.error("Application ID is not available to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(applicationLabel);
      toast.success("Application ID copied");
    } catch {
      toast.error("Unable to copy application ID");
    }
  };

  if (loading || !req) {
    return (
      <AdminLayout>
        <DetailViewSkeleton />
      </AdminLayout>
    );
  }

  const canRevise = req.status === "update_required";
  const workflowLabel = showingSharedWorkflowTemplate
    ? "Global workflow"
    : hasCustomWorkflow
      ? "Custom service workflow"
      : hasServiceSpecificWorkflow
        ? "Service workflow"
        : "No workflow";

  return (
    <AuthGuard allowedRoles={["accountant"]}>
      <AdminLayout>
        <div className="mx-auto max-w-[96rem] space-y-8 pb-24 px-4 md:px-6">
          <div className="overflow-hidden rounded-[2.25rem] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(240,249,255,0.92)_42%,_rgba(255,255,255,1)_75%)] px-5 py-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] md:px-8 md:py-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex items-start gap-4 md:gap-6">
                <Link
                  href="/accountant/service-requests"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] border border-slate-200 bg-white text-blue-600 shadow-lg shadow-slate-200/70 transition-all hover:-translate-y-0.5 hover:text-blue-700"
                >
                  <i className="fas fa-chevron-left text-sm"></i>
                </Link>
                <div className="min-w-0">
                  <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                    {req.service?.name}
                  </h1>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    <span>Order ID:</span>
                    <span className="text-blue-600">
                      #{req.application_unique_id || req.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleCopyApplicationId()}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
                      title="Copy application ID"
                    >
                      <i className="far fa-copy text-sm" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 xl:justify-end">
                <StatusIndicator
                  status={req.status}
                  className="px-5 py-3 text-xs shadow-sm"
                  size="lg"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Client
              </p>
              <p className="mt-2 text-base font-bold text-slate-950">
                {req.user?.name || "Unknown"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Phone
              </p>
              <p className="mt-2 text-base font-bold text-slate-950">
                {req.user?.mobile_number || "---"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Email
              </p>
              <p className="mt-2 truncate text-base font-bold text-slate-950">
                {req.user?.email || "---"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Workflow
              </p>
              <p className="mt-2 text-base font-bold text-slate-950">
                {workflowLabel}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-10 lg:col-span-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-950">
                      Milestone timeline
                    </h3>
                  </div>
                </div>

                <MilestoneTimeline
                  timelineStages={timelineStages}
                  currentWorkflowStage={currentWorkflowStage}
                  currentWorkflowOrder={currentWorkflowOrder}
                  workflowTrackFill={workflowTrackFill}
                  clientMessage={req.client_message}
                  hasCustomWorkflow={hasServiceSpecificWorkflow}
                  status={req.status}
                  stepIndex={stepIndex}
                  completedAt={
                    req.updated_at
                      ? formatDateWithPattern(
                          req.updated_at,
                          "d MMM yyyy, h:mm a",
                        )
                      : undefined
                  }
                />
              </div>

              {/* Information Provided */}
              <FormDataRenderer
                formData={req.form_data}
                title="Application Artifacts"
                icon="fa-id-card"
              />

              {/* Instructions Section */}
              {req.ca_notes && (
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <i className="fas fa-info-circle text-slate-400" />
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Internal Directives
                    </h3>
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">
                    {req.ca_notes}
                  </p>
                </div>
              )}

              {/* Revision Action Area */}
              {canRevise && (
                <div className="p-8 bg-rose-50 rounded-3xl border border-rose-100">
                  <div className="flex items-start gap-4 mb-8">
                    <div className="w-12 h-12 bg-white text-rose-500 rounded-2xl flex items-center justify-center shadow-sm border border-rose-100 shrink-0">
                      <i className="fas fa-exclamation-triangle" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-rose-900 tracking-tight">
                        Correction Required
                      </h3>
                      <p className="text-sm text-rose-700/70 mt-1 font-medium">
                        {req.update_note ||
                          req.revision_notes ||
                          "Client needs to address specific discrepancies."}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <textarea
                      rows={4}
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                      placeholder="Specify the corrections performed..."
                      className="w-full bg-white border border-rose-200 rounded-2xl p-5 text-sm font-medium focus:ring-0 outline-none transition-all shadow-sm"
                    />
                    <button
                      onClick={handleRevisionSubmit}
                      disabled={updating || !revisionNotes.trim()}
                      className="w-full h-12 bg-rose-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-md disabled:opacity-30"
                    >
                      {updating ? (
                        <i className="fas fa-spinner fa-spin" />
                      ) : (
                        "Commit Corrections"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Document Repository */}
              <RequestDocumentList
                documents={getRequestDocuments(req)}
                role="accountant"
                userId={req.user?.id}
                onDeleteDocument={handleDeleteDoc}
                onUpdateDocumentStatus={handleUpdateDocStatus}
                onUploadDocument={async (file, docType, notes) => {
                  const formData = new FormData();
                  formData.append("document", file);
                  formData.append("document_type", docType);
                  formData.append("notes", notes);
                  if (req.status === "in_progress" && docType === "internal") {
                    formData.append("is_final", "true");
                  }
                  const uploadResponse = await apiClient.post(
                    `/accountant/service-requests/${id}/documents`,
                    formData,
                    {
                      headers: { "Content-Type": "multipart/form-data" },
                    },
                  );
                  await fetchData(extractDocumentList(uploadResponse.data));
                }}
                actionLoading={updating}
              />
            </div>

            {/* Strategic Controls */}
            <div className="space-y-10">
              {/* Task Management */}
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <h3 className="mb-6 text-lg font-bold tracking-tight text-slate-900">
                  Management
                </h3>

                {["completed", "approved", "submitted_to_ca"].includes(
                  req.status,
                ) && (
                  <div className="mb-6">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                        <i
                          className={`fas ${req.status === "submitted_to_ca" ? "fa-hourglass-half" : "fa-check-circle"}`}
                        ></i>
                        {req.status === "submitted_to_ca"
                          ? "Review Pending"
                          : "Workflow Finalized"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {hasServiceSpecificWorkflow &&
                      selectableWorkflowStages.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Service Milestones
                          </p>
                          <button
                            onClick={openStageModal}
                            className="h-12 w-full rounded-2xl border border-slate-900 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-900 transition-all hover:bg-slate-900 hover:text-white"
                          >
                            Update Milestone
                          </button>
                        </div>
                      )}

                    {(req.status === "applied" || req.status === "paid") && (
                      <button
                        onClick={() => handleQuickStageUpdate("under_review")}
                        disabled={updating}
                        className="w-full h-12 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
                      >
                        {updating ? (
                          <i className="fas fa-spinner fa-spin" />
                        ) : (
                          "Initiate Review"
                        )}
                      </button>
                    )}

                    {req.status === "under_review" && (
                      <div className="space-y-4">
                        <button
                          onClick={() => handleQuickStageUpdate("in_progress")}
                          disabled={updating}
                          className="w-full h-12 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
                        >
                          {updating ? (
                            <i className="fas fa-spinner fa-spin" />
                          ) : (
                            "Approve Docs"
                          )}
                        </button>
                        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-left">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700 flex items-center gap-1.5 mb-1.5">
                            <i className="fas fa-info-circle" /> How to Request
                            Updates
                          </p>
                          <p className="text-[11px] font-medium leading-relaxed text-blue-900">
                            To request corrections or updates, simply select{" "}
                            <strong className="text-rose-700">
                              Corrections
                            </strong>{" "}
                            for any document in the Client Documents section
                            below.
                          </p>
                        </div>
                      </div>
                    )}

                    {req.status === "in_progress" && (
                      <button
                        onClick={() =>
                          handleQuickStageUpdate("submitted_to_ca")
                        }
                        disabled={updating}
                        className="w-full h-12 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
                      >
                        {updating ? (
                          <i className="fas fa-spinner fa-spin" />
                        ) : (
                          "Submit Dossier"
                        )}
                      </button>
                    )}

                    {req.status === "update_required" && (
                      <button
                        onClick={() => handleQuickStageUpdate("under_review")}
                        disabled={updating}
                        className="w-full h-12 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
                      >
                        {updating ? (
                          <i className="fas fa-spinner fa-spin" />
                        ) : (
                          "Restart Review"
                        )}
                      </button>
                    )}

                    {(canCompleteRequest || canCancelRequest) && (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {canCompleteRequest && (
                          <button
                            onClick={() => handleQuickStageUpdate("completed")}
                            disabled={updating}
                            className="h-12 rounded-2xl bg-emerald-600 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {updating ? (
                              <i className="fas fa-spinner fa-spin" />
                            ) : (
                              "Complete Service"
                            )}
                          </button>
                        )}

                        {canCancelRequest && (
                          <button
                            onClick={() => handleQuickStageUpdate("cancelled")}
                            disabled={updating}
                            className="h-12 rounded-2xl border border-rose-200 bg-rose-50 text-[11px] font-bold uppercase tracking-wider text-rose-700 transition-all hover:border-rose-300 hover:bg-rose-100 disabled:opacity-50"
                          >
                            {updating ? (
                              <i className="fas fa-spinner fa-spin" />
                            ) : (
                              "Cancel Service"
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>

      <Modal
        isOpen={showStageModal}
        onClose={() => setShowStageModal(false)}
        title="Update Service Milestone"
      >
        <form onSubmit={handleUpdateWorkflowStage} className="space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
              This Service Only
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              These milestones belong to this service only. Updating this does
              not change the shared lifecycle status used across all services.
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
            options={selectableWorkflowStages.map((stage) => ({
              value: stage.id,
              label: `${stage.timeline_index}. ${getWorkflowStageLabel(
                stage,
                stage.timeline_index,
              )}${stage.is_required ? " (Required)" : " (Optional)"}`,
            }))}
            helpText={workflowStageSummary}
          />
          <FormTextarea
            label="Client Message"
            value={stageForm.client_message}
            onChange={(e) =>
              setStageForm({ ...stageForm, client_message: e.target.value })
            }
            placeholder="Optional progress note for the client."
          />
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-2xl h-14 font-bold text-xs uppercase tracking-widest"
              onClick={() => setShowStageModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-2xl h-14 bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-400"
              loading={updating}
            >
              Save Milestone
            </Button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  );
}
