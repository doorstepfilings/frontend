"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { apiClient } from "@/lib/api/client";
import { toast } from "react-hot-toast";
import {
  isClientUploadedDocument,
  isInternalDocument,
} from "@/lib/utils/document-helpers";
import { format } from "date-fns";
import { getMilestoneState } from "@/lib/utils/status-helpers";
import { AccountantDocumentList } from "./accountant-document-list";
import { AccountantUploadForm } from "./accountant-upload-form";
import { FormDataRenderer } from "@/components/ui/form-data-renderer";
import { Modal } from "@/components/ui/modal";
import { FormSelect, FormTextarea } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";
import { ChatNoteModal } from "@/components/ui/chat-note-modal";
import { useStoredUser } from "@/lib/auth/hooks";
import { useConfirm } from "@/hooks/use-confirm";

import { PageLogoLoader } from "@/components/ui/logo-loader";

const MILESTONES = [
  { id: 1, label: "Submission" },
  { id: 2, label: "Payment" },
  { id: 3, label: "Verification" },
  { id: 4, label: "Processing" },
  { id: 5, label: "Completion" },
];

export function AccountantRequestDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const currentUser = useStoredUser();
  const { confirm, ConfirmDialog } = useConfirm();

  const [req, setReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: "",
    ca_notes: "",
    update_note: "",
    rejection_reason: "",
  });
  const [activeDocTab, setActiveDocTab] = useState<"client" | "sent" | "internal">("client");
  const [viewingNoteService, setViewingNoteService] = useState(false);

  const noteCount = useMemo(() => {
    const notes = req?.update_note || req?.revision_notes || "";
    if (!notes) return 0;
    return notes.split("\n\n").filter((n: string) => n.trim() !== "").length;
  }, [req?.update_note, req?.revision_notes]);

  const fetchData = async () => {
    try {
      const res = await apiClient.get(`/accountant/service-requests/${id}`);
      setReq(res.data?.data || res.data);
      // Initialize status form with current status
      setStatusForm(prev => ({ ...prev, status: res.data?.data?.status || prev.status }));
    } catch (err) {
      toast.error("Failed to synchronize dossier");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id) fetchData();
  }, [id]);

  const { currentStep, isWarning } = useMemo(() => {
    return getMilestoneState(req?.status);
  }, [req?.status]);

  const progress = Math.round(((currentStep) / MILESTONES.length) * 100);

  const handleUpdateStatus = async (eOrData?: React.FormEvent | { status: string; update_note?: string; ca_notes?: string; rejection_reason?: string }) => {
    let data: any = statusForm;

    // Check if it's a direct data object or a form event
    if (eOrData && typeof eOrData === 'object' && 'status' in eOrData) {
      data = eOrData;
    } else {
      if (eOrData) {
        (eOrData as React.FormEvent).preventDefault();
      }
      
      let finalUpdateNote = req.update_note || req.revision_notes || "";
      const noteText = statusForm.status === "update_required" ? statusForm.update_note : (statusForm.status === "rejected" ? statusForm.rejection_reason : "");
      if (noteText.trim()) {
        const roleName = currentUser?.role === "super_admin" ? "Admin" : "Accountant";
        const senderName = currentUser?.name;
        const formattedNote = senderName ? `${roleName} (${senderName}): ${noteText.trim()}` : `${roleName}: ${noteText.trim()}`;
        finalUpdateNote = finalUpdateNote ? `${finalUpdateNote}\n\n${formattedNote}` : formattedNote;
      }
      
      data = {
        status: statusForm.status,
        ca_notes: statusForm.ca_notes,
        rejection_reason: statusForm.rejection_reason,
        update_note: finalUpdateNote,
      };
    }

    if (!data.status) return toast.error("Please select a target status");

    // Explicit confirmation when finalizing
    if (data.status === "completed") {
      const isConfirmed = await confirm({
        title: "Finalize Service",
        message: "Are you absolutely sure you want to mark this service as Completed? Please double-check that ALL related filings, documents, and tasks have been finished. Once finalized, completion notifications will be sent to the client.",
      });
      if (!isConfirmed) return;
    }

    setUpdating(true);
    try {
      await apiClient.patch(`/accountant/service-requests/${id}/status`, data);
      toast.success("Service status updated successfully");
      setShowStatusModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };


  const handleDeleteDoc = async (docId: string | number) => {
    const isConfirmed = await confirm({
      title: "Delete Document",
      message:
        "Are you sure you want to permanently delete this document sent to the client?",
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await apiClient.delete(`/accountant/service-requests/${id}/documents/${docId}`);
      toast.success("Deleted document successfully");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete document");
    }
  };

  const handleUpdateDocStatus = async (doc: any, status: string, remark?: string) => {
    try {
      await apiClient.patch(
        `/accountant/service-requests/${id}/documents/${doc.id}/status`,
        {
          status,
          ...(remark ? { notes: remark, remark } : {}),
        },
      );
      toast.success("Client document comment updated");
      fetchData();
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const handleReplaceApprovalDoc = async (
    doc: any,
    file: File,
    notes?: string,
  ) => {
    const formData = new FormData();
    formData.append("document", file);
    if (notes) {
      formData.append("notes", notes);
    }

    try {
      await apiClient.post(
        `/accountant/service-requests/${id}/documents/${doc.id}/replace`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      toast.success("Document update sent for client approval");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Document update failed");
    }
  };

  if (loading || !req) {
    return (
      <AdminLayout>
        <PageLogoLoader label="Accessing work order..." />
      </AdminLayout>
    );
  }

  const requestDocuments = Array.isArray(req.request_documents)
    ? req.request_documents.filter(
        (doc: any) =>
          !["replaced", "superseded"].includes(
            String(doc.status || "").toLowerCase(),
          ),
      )
    : [];
  const clientDocs = requestDocuments.filter((doc: any) =>
    isClientUploadedDocument(doc, req.user?.id),
  );
  const sentToClientDocs = requestDocuments.filter(
    (doc: any) =>
      !isClientUploadedDocument(doc, req.user?.id) &&
      !isInternalDocument(doc),
  );
  const internalDocs = requestDocuments.filter(
    (doc: any) =>
      !isClientUploadedDocument(doc, req.user?.id) &&
      isInternalDocument(doc),
  );
  const activeDocuments =
    activeDocTab === "client"
      ? clientDocs
      : activeDocTab === "sent"
        ? sentToClientDocs
        : internalDocs;
  const canUpload = !["cancelled", "approved", "completed", "rejected"].includes(req.status);

  return (
    <AuthGuard allowedRoles={["accountant"]}>
      <AdminLayout>
        <div className="max-w-6xl mx-auto space-y-8 pb-24 px-6">
          {/* Professional Navigation Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
            <div className="flex items-center gap-5">
              <Link
                href="/accountant/service-requests"
                className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
              >
                <i className="fas fa-chevron-left text-xs"></i>
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{req.service?.name}</h1>
                  <StatusIndicator status={req.status} />
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Order ID: <span className="text-slate-600">#{req.application_unique_id || req.id}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewingNoteService(true)}
                className="h-10 px-5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-2 shadow-sm"
              >
                <i className="fas fa-comment-dots text-blue-500"></i> Service Notes
                {noteCount > 0 && (
                  <span className="ml-1 bg-blue-600 text-white rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    {noteCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-10 shadow-sm space-y-8">
            {/* 1. Refined Progress Tracker */}
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Processing Roadmap</h3>
                <div className={`px-3 py-1 text-white rounded-lg text-[10px] font-bold ${
                  req.status === "completed" || req.status === "approved"
                    ? "bg-emerald-600"
                    : (isWarning ? (req.status === "update_required" ? "bg-red-500" : "bg-amber-500") : "bg-slate-900")
                }`}>
                  {req.status === "completed" || req.status === "approved" ? "Completed" : `Stage ${currentStep} of ${MILESTONES.length}`} {isWarning && req.status !== "completed" && (req.status === "update_required" ? "- Correction Required" : "- Action Needed")}
                </div>
              </div>

              <div className="overflow-x-auto pb-4 hide-scrollbar">
                <div className="relative px-2 min-w-[500px]">
                  <div className="absolute top-[1.125rem] left-10 right-10 h-0.5 bg-slate-100" />
                  <div
                    className={`absolute top-[1.125rem] left-10 h-0.5 transition-all duration-1000 ${
                      req.status === "completed" || req.status === "approved"
                        ? "bg-emerald-500"
                        : (isWarning ? (req.status === "update_required" ? "bg-red-500" : "bg-amber-500") : "bg-slate-900")
                    }`}
                    style={{ width: `calc((100% - 5rem) * ${(currentStep - 1) / (MILESTONES.length - 1)})` }}
                  />

                  <div className="relative z-10 flex justify-between">
                    {MILESTONES.map((step, i) => {
                      const isActive = step.id <= currentStep;
                      const isCurrent = step.id === currentStep;
                      const isStepCompleted = (isActive && !isCurrent) || (req.status === "completed" || req.status === "approved");

                      let circleClasses = "bg-white border-slate-100 text-slate-200";
                      if (isActive) circleClasses = "bg-white border-slate-900 text-slate-900 shadow-sm";
                      if (isStepCompleted) {
                        circleClasses = "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm shadow-emerald-500/10";
                      } else if (isCurrent && isWarning) {
                        circleClasses = req.status === "update_required"
                          ? "bg-red-50 border-red-500 text-red-600 shadow-sm shadow-red-500/20"
                          : "bg-amber-50 border-amber-500 text-amber-600 shadow-sm shadow-amber-500/20";
                      }

                      return (
                        <div key={step.id} className="flex flex-col items-center gap-4">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 ${circleClasses}`}>
                            {isStepCompleted ? <i className="fas fa-check text-[10px]" /> : step.id}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wide text-center max-w-[80px] ${
                            isActive 
                              ? (isCurrent && isWarning 
                                ? (req.status === "update_required" ? "text-red-600" : "text-amber-600") 
                                : (isStepCompleted ? "text-emerald-600" : "text-slate-900")) 
                              : "text-slate-300"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 2. Details Grid (3 columns on desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Column A: Client Profile */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                  Client Profile
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                      Name
                    </p>
                    <p className="text-sm font-black text-slate-900 tracking-tight">
                      {req.user?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                      Contact
                    </p>
                    <p className="text-sm font-black text-slate-900 tracking-tight">
                      {req.user?.mobile_number || "---"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                      Email Address
                    </p>
                    <p className="text-sm font-black text-slate-900 tracking-tight truncate max-w-[200px]" title={req.user?.email}>
                      {req.user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Column B: Submission Details */}
              <div className="space-y-6 border-t border-slate-100 pt-6 md:border-t-0 md:pt-0 md:border-l md:pl-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                  Application Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                      Submission Date
                    </p>
                    <p className="text-sm font-black text-slate-900 tracking-tight">
                      {req.created_at ? format(new Date(req.created_at), "MMMM d, yyyy") : "---"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                      Category
                    </p>
                    <p className="text-sm font-black text-slate-900 tracking-tight">
                      {req.service?.category?.name || "General"}
                    </p>
                  </div>
                  {req.form_data?.pricing_plan && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                        Selected Plan
                      </p>
                      <p className="text-sm font-black text-slate-900 tracking-tight">
                        {req.form_data.pricing_plan}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Column C: Appointment Info */}
              <div className="space-y-6 border-t border-slate-100 pt-6 md:border-t-0 md:pt-0 md:border-l md:pl-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                  Appointment details
                </h3>
                {req.form_data?.appointment_request === "yes" ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                        Scheduled Date
                      </p>
                      <p className="text-sm font-black text-slate-900 tracking-tight">
                        {req.form_data.scheduled_date}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                        Scheduled Time
                      </p>
                      <p className="text-sm font-black text-slate-900 tracking-tight">
                        {req.form_data.scheduled_time}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 mt-2">
                      <i className="fas fa-check-circle text-xs"></i>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Confirmed Slot
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs font-medium italic uppercase tracking-wider">
                    No appointment requested
                  </div>
                )}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 3. Task Management controls */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-base font-black tracking-tight text-slate-900">
                  Process Status Management
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Perform operations on this request
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 min-w-[280px]">
                {["completed", "approved"].includes(req.status) ? (
                  <div className="flex items-center gap-2 text-emerald-600 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 font-bold text-xs uppercase tracking-wider">
                    <i className="fas fa-check-circle"></i>
                    Workflow Finalized
                  </div>
                ) : (
                  <>
                    {(req.status === "applied" || req.status === "paid") && (
                      <button
                        onClick={() => handleUpdateStatus({ status: "under_review" })}
                        className="h-11 px-5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10"
                      >
                        Initiate Review
                      </button>
                    )}

                    {req.status === "under_review" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus({ status: "in_progress" } as any)}
                          className="h-11 px-5 bg-blue-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-800 transition-all shadow-md shadow-blue-900/10"
                        >
                          Approve Docs
                        </button>
                        <button
                          onClick={() => {
                            setStatusForm({ ...statusForm, status: "update_required" });
                            setShowStatusModal(true);
                          }}
                          className="h-11 px-5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition-all"
                        >
                          Request Updates
                        </button>
                      </>
                    )}

                    {req.status === "in_progress" && (
                      <button
                        onClick={() => handleUpdateStatus({ status: "completed" } as any)}
                        className="h-11 px-5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10"
                      >
                        Complete Service
                      </button>
                    )}

                    {req.status === "update_required" && (
                      <button
                        onClick={() => handleUpdateStatus({ status: "under_review" } as any)}
                        className="h-11 px-5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10"
                      >
                        Restart Review
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={() => setShowStatusModal(true)}
                  className="h-11 px-4 text-slate-500 hover:text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 hover:bg-slate-50"
                >
                  Advanced controls
                </button>
              </div>
            </div>

            {/* 4. Internal Directives Section */}
            {req.ca_notes && (
              <>
                <hr className="border-slate-100" />
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-info-circle text-slate-400 text-xs" />
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Internal Directives</h3>
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">
                    {req.ca_notes}
                  </p>
                </div>
              </>
            )}

            <hr className="border-slate-100" />

            {/* 5. Information Provided (FormDataRenderer) */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
              <FormDataRenderer
                formData={req.form_data}
                title="Application Artifacts"
                icon="fa-id-card"
              />
            </div>

            <hr className="border-slate-100" />

            {/* 6. Document Repository */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Document Repository</h3>
              
              {canUpload && (
                <AccountantUploadForm
                  requestId={id}
                  onSuccess={fetchData}
                  showFinalToggle={req.status === "in_progress"}
                />
              )}

              {/* Repository Filter */}
              <div className="grid grid-cols-3 p-1 bg-slate-100/80 rounded-xl max-w-2xl">
                <button
                  onClick={() => setActiveDocTab("client")}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeDocTab === "client" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Client Submissions ({clientDocs.length})
                </button>
                <button
                  onClick={() => setActiveDocTab("sent")}
                  className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeDocTab === "sent" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Sent to Client ({sentToClientDocs.length})
                </button>
                <button
                  onClick={() => setActiveDocTab("internal")}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeDocTab === "internal" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Internal Documents ({internalDocs.length})
                </button>
              </div>

              <div className="animate-in fade-in duration-500">
                <AccountantDocumentList
                  title={
                    activeDocTab === "client"
                      ? "Client Documents"
                      : activeDocTab === "sent"
                        ? "Documents Sent to Client"
                        : "Internal Documents"
                  }
                  documents={activeDocuments}
                  onDelete={handleDeleteDoc}
                  onUpdateStatus={
                    activeDocTab === "internal"
                      ? undefined
                      : handleUpdateDocStatus
                  }
                  onReplaceDocument={
                    activeDocTab === "sent"
                      ? handleReplaceApprovalDoc
                      : undefined
                  }
                  clientName={req.user?.name}
                  accountantName={currentUser?.name}
                />
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>



      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Workflow Management">
        <form onSubmit={handleUpdateStatus} className="space-y-8">
          <FormSelect
            label="Override Status"
            value={statusForm.status}
            onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
            options={[
              { value: "applied", label: "Initial Submission" },
              { value: "under_review", label: "Verification Stage" },
              { value: "in_progress", label: "Processing Stage" },

              { value: "update_required", label: "Request Client Correction" },
              { value: "completed", label: "Success / Completed" },
              { value: "rejected", label: "Reject Filing" },
              { value: "cancelled", label: "Cancel Application" },
            ]}
          />

          {statusForm.status === "update_required" && (
            <FormTextarea
              label="Update Directives"
              required
              value={statusForm.update_note}
              onChange={(e) => setStatusForm({ ...statusForm, update_note: e.target.value })}
              placeholder="Clearly state what the client must address..."
            />
          )}

          {statusForm.status === "rejected" && (
            <FormTextarea
              label="Grounds for Rejection"
              required
              value={statusForm.rejection_reason}
              onChange={(e) => setStatusForm({ ...statusForm, rejection_reason: e.target.value })}
              placeholder="State the official reason for refusal..."
            />
          )}

          <FormTextarea
            label="Internal Dossier Notes"
            value={statusForm.ca_notes}
            onChange={(e) => setStatusForm({ ...statusForm, ca_notes: e.target.value })}
            placeholder="Private context for internal review..."
          />

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" className="flex-1 rounded-2xl h-14 font-bold text-xs uppercase tracking-widest" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 rounded-2xl h-14 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest shadow-xl" loading={updating}>
              Apply Change
            </Button>
          </div>
        </form>
      </Modal>

      <ChatNoteModal
        isOpen={viewingNoteService}
        onClose={() => setViewingNoteService(false)}
        title="Service Notes"
        contextName={req.service?.name || "Service Application"}
        noteText={req.update_note || req.revision_notes || ""}
        userType="accountant"
        fallbackSender={currentUser?.name || "Accountant"}
        fallbackRole="Accountant"
        clientName={req.user?.name}
        accountantName={currentUser?.name}
        onSubmitNote={async (note: string) => {
          const roleName = currentUser?.role === "super_admin" ? "Admin" : "Accountant";
          const senderName = currentUser?.name;
          const formattedNote = senderName ? `${roleName} (${senderName}): ${note}` : `${roleName}: ${note}`;
          const currentNotes = req.update_note || req.revision_notes || "";
          const newNoteText = currentNotes ? `${currentNotes}\n\n${formattedNote}` : formattedNote;
          await handleUpdateStatus({ status: req.status, update_note: newNoteText });
          setReq({ ...req, update_note: newNoteText });
        }}
      />
      <ConfirmDialog />
    </AuthGuard>
  );
}
