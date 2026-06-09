"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  fetchAdminApplicationDetail,
  updateApplicationStatus,
  updateDocumentStatus,
} from "@/lib/features/admin/admin-slice";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageLogoLoader } from "@/components/ui/logo-loader";
import { AuthGuard } from "@/components/auth/auth-guard";
import { toast } from "react-hot-toast";
import { StatusManagement } from "./status-management";
import { FormDataRenderer } from "@/components/ui/form-data-renderer";
import { AccountantDocumentList } from "@/components/accountant/accountant-document-list";
import { splitDocumentsByOwner } from "@/lib/utils/document-helpers";
import { format } from "date-fns";
import { getStatusConfig, getMilestoneState } from "@/lib/utils/status-helpers";
import { ChatNoteModal } from "@/components/ui/chat-note-modal";
import { useStoredUser } from "@/lib/auth/hooks";
import { parseApiError } from "@/lib/utils/error-parser";

const MILESTONES = [
  { id: 1, label: "Submission" },
  { id: 2, label: "Payment" },
  { id: 3, label: "Verification" },
  { id: 4, label: "Processing" },
  { id: 5, label: "Completion" },
];

export function ApplicationDetailView() {
  const params = useParams();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState<"overview" | "data" | "documents" | "logs">("overview");
  const [viewingNoteService, setViewingNoteService] = useState(false);

  const dispatch = useAppDispatch();
  const currentUser = useStoredUser();
  const { selectedApplication: app, loading, actionLoading } = useAppSelector(
    (state) => state.admin,
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchAdminApplicationDetail(id));
    }
  }, [id, dispatch]);

  const handleUpdateDocStatus = async (
    doc: any,
    status: string,
    remark?: string,
  ) => {
    const resultAction = await dispatch(
      updateDocumentStatus({
        applicationId: id,
        docId: doc.id,
        status,
        remark,
      }),
    );
    if (updateDocumentStatus.fulfilled.match(resultAction)) {
      toast.success("Document updated");
      dispatch(fetchAdminApplicationDetail(id));
    } else {
      toast.error("Update failed");
    }
  };

  const { currentStep, isWarning } = useMemo(() => {
    return getMilestoneState(app?.status);
  }, [app?.status]);

  const noteCount = useMemo(() => {
    const notes = app?.update_note || app?.revision_notes || "";
    if (!notes) return 0;
    return notes.split("\n\n").filter((n: string) => n.trim() !== "").length;
  }, [app?.update_note, app?.revision_notes]);

  if (loading || !app) {
    return (
      <AdminLayout>
        <PageLogoLoader label="Loading details..." />
      </AdminLayout>
    );
  }

  const { clientDocs, internalDocs } = splitDocumentsByOwner(
    app.request_documents || [],
    app.user?.id,
  );
  const statusConfig = getStatusConfig(app.status);

  const orderLabel =
    app.order_unique_id || app.application_unique_id || String(app.id);
  const paymentStatus = ["paid", "success"].includes(
    String(app.payment_status || "").toLowerCase(),
  )
    ? "Paid"
    : "Pending";
  const receivedAt = app.order_created_at || app.created_at || null;

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="mx-auto max-w-6xl space-y-8 pb-24 px-6">
          <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-8 md:flex-row md:items-center">
            <div className="flex items-center gap-5">
              <Link
                href="/admin/service-applications"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-blue-100 hover:text-blue-600"
              >
                <i className="fas fa-chevron-left text-xs"></i>
              </Link>
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Order #{orderLabel}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusConfig.color}`}
                  >
                    <i className={`fas ${statusConfig.icon} text-[9px]`}></i>
                    {statusConfig.label}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {app.service?.name}
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
            {/* 1. Refined Progress Tracker (Roadmap) */}
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Processing Roadmap</h3>
                <div className={`px-3 py-1 text-white rounded-lg text-[10px] font-bold ${app.status === "completed" || app.status === "approved"
                    ? "bg-emerald-600"
                    : (isWarning ? (app.status === "update_required" ? "bg-red-500" : "bg-amber-500") : "bg-slate-900")
                  }`}>
                  {app.status === "completed" || app.status === "approved" ? "Completed" : `Stage ${currentStep} of ${MILESTONES.length}`} {isWarning && app.status !== "completed" && (app.status === "update_required" ? "- Correction Required" : "- Action Needed")}
                </div>
              </div>

              <div className="overflow-x-auto pb-4 hide-scrollbar">
                <div className="relative px-2 min-w-[500px]">
                  <div className="absolute top-[1.125rem] left-10 right-10 h-0.5 bg-slate-100" />
                  <div
                    className={`absolute top-[1.125rem] left-10 h-0.5 transition-all duration-1000 ${app.status === "completed" || app.status === "approved"
                        ? "bg-emerald-500"
                        : (isWarning ? (app.status === "update_required" ? "bg-red-500" : "bg-amber-500") : "bg-slate-900")
                      }`}
                    style={{ width: `calc((100% - 5rem) * ${(currentStep - 1) / (MILESTONES.length - 1)})` }}
                  />

                  <div className="relative z-10 flex justify-between">
                    {MILESTONES.map((step, i) => {
                      const isActive = step.id <= currentStep;
                      const isCurrent = step.id === currentStep;
                      const isStepCompleted = (isActive && !isCurrent) || (app.status === "completed" || app.status === "approved");

                      let circleClasses = "bg-white border-slate-100 text-slate-200";
                      if (isActive) circleClasses = "bg-white border-slate-900 text-slate-900 shadow-sm";
                      if (isStepCompleted) {
                        circleClasses = "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm shadow-emerald-500/10";
                      } else if (isCurrent && isWarning) {
                        circleClasses = app.status === "update_required"
                          ? "bg-red-50 border-red-500 text-red-600 shadow-sm shadow-red-500/20"
                          : "bg-amber-50 border-amber-500 text-amber-600 shadow-sm shadow-amber-500/20";
                      }

                      return (
                        <div key={step.id} className="flex flex-col items-center gap-4">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 ${circleClasses}`}>
                            {isStepCompleted ? <i className="fas fa-check text-[10px]" /> : step.id}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wide text-center max-w-[80px] ${isActive
                              ? (isCurrent && isWarning
                                ? (app.status === "update_required" ? "text-red-600" : "text-amber-600")
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

            {/* Tabs Navigation */}
            <div className="flex p-1 bg-slate-100/80 rounded-xl max-w-lg">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "overview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                type="button"
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("data")}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "data" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                type="button"
              >
                Application Data
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "documents" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                type="button"
              >
                Documents ({clientDocs.length + internalDocs.length})
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "logs" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                type="button"
              >
                Communication Notes
              </button>
            </div>

            {/* Tab Contents */}
            <div className="animate-in fade-in duration-300">
              {activeTab === "overview" && (
                <div className="space-y-8">
                  {/* Details Grid (3 columns on desktop) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Column A: Client Profile */}
                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                        Client Profile
                      </h3>
                      <div className="space-y-4">
                        <DetailRow label="Name" value={app.user?.name} />
                        <DetailRow label="Email Address" value={app.user?.email} />
                        <DetailRow label="Contact Number" value={app.user?.mobile_number} />
                      </div>
                    </div>

                    {/* Column B: Financial Snapshot */}
                    <div className="space-y-6 border-t border-slate-100 pt-6 md:border-t-0 md:pt-0 md:border-l md:pl-8">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                        Financial Snapshot
                      </h3>
                      <div className="space-y-4">
                        <DetailRow
                          label="Service Fee"
                          value={`Rs ${Math.round(app.amount).toLocaleString("en-IN")}`}
                        />
                        <DetailRow label="Payment Status" value={paymentStatus} />
                        <DetailRow
                          label="Date Received"
                          value={
                            receivedAt
                              ? format(new Date(receivedAt), "dd MMM yyyy")
                              : "-"
                          }
                        />
                        <DetailRow
                          label="Invoice ID"
                          value={app.invoice_unique_id || "-"}
                        />
                      </div>
                    </div>

                    {/* Column C: Appointment Info */}
                    <div className="space-y-6 border-t border-slate-100 pt-6 md:border-t-0 md:pt-0 md:border-l md:pl-8">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                        Appointment details
                      </h3>
                      {app.form_data?.appointment_request === "yes" ? (
                        <div className="space-y-4">
                          <DetailRow
                            label="Scheduled Date"
                            value={app.form_data.scheduled_date}
                          />
                          <DetailRow
                            label="Scheduled Time"
                            value={app.form_data.scheduled_time}
                          />
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

                  {/* Process Management */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 md:p-8">
                    <h3 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      Process Management
                    </h3>
                    <StatusManagement application={app} />
                  </div>
                </div>
              )}

              {activeTab === "data" && (
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                  <FormDataRenderer
                    formData={app.form_data}
                    title="Application Data"
                    icon="fa-database"
                  />
                </div>
              )}

              {activeTab === "documents" && (
                <div className="space-y-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Attached Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AccountantDocumentList
                      title="Client Submission Documents"
                      documents={clientDocs}
                      onDelete={() => { }}
                      onUpdateStatus={handleUpdateDocStatus}
                      canUpload={false}
                      clientName={app.user?.name}
                      accountantName={app.accountant?.name || currentUser?.name}
                    />
                    <AccountantDocumentList
                      title="Internal Verification Documents"
                      documents={internalDocs}
                      onDelete={() => { }}
                      onUpdateStatus={handleUpdateDocStatus}
                      allowInternalStatusUpdate
                      canUpload={false}
                      clientName={app.user?.name}
                      accountantName={app.accountant?.name || currentUser?.name}
                    />
                  </div>
                </div>
              )}

              {activeTab === "logs" && (
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Communication Log</h3>
                  
                  {/* Service Notes Chat */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-600/15">
                            <i className="fas fa-comments text-white text-sm"></i>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">Service Notes Thread</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {noteCount > 0 ? `${noteCount} message${noteCount > 1 ? "s" : ""}` : "No messages yet"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setViewingNoteService(true)}
                          className="h-10 px-5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md shadow-blue-600/15 flex items-center gap-2"
                        >
                          <i className="fas fa-comment-dots"></i> 
                          {noteCount > 0 ? "View & Reply" : "Start Conversation"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Static Notes Summary Cards */}
                  {(app.notes || app.ca_notes || app.rejection_reason) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {app.notes && (
                        <NoteBox
                          label="Client Instruction"
                          text={app.notes}
                          color="slate"
                        />
                      )}
                      {app.ca_notes && (
                        <NoteBox
                          label="Internal Note"
                          text={app.ca_notes}
                          color="blue"
                        />
                      )}
                      {app.rejection_reason && (
                        <NoteBox
                          label="Reason for Rejection"
                          text={app.rejection_reason}
                          color="rose"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Service Notes ChatNoteModal */}
        <ChatNoteModal
          isOpen={viewingNoteService}
          onClose={() => setViewingNoteService(false)}
          title="Service Notes"
          contextName={app.service?.name || "Service Application"}
          noteText={app.update_note || app.revision_notes || ""}
          userType="admin"
          fallbackSender={currentUser?.name || "Admin"}
          fallbackRole="Admin"
          clientName={app.user?.name}
          accountantName={app.accountant?.name || currentUser?.name}
          onSubmitNote={async (note: string) => {
            const senderName = currentUser?.name;
            const formattedNote = senderName ? `Admin (${senderName}): ${note}` : `Admin: ${note}`;
            const currentNotes = app.update_note || app.revision_notes || "";
            const newNoteText = currentNotes ? `${currentNotes}\n\n${formattedNote}` : formattedNote;
            
            const resultAction = await dispatch(
              updateApplicationStatus({
                id: app.id,
                status: app.status,
                update_note: newNoteText,
              })
            );
            if (updateApplicationStatus.fulfilled.match(resultAction)) {
              dispatch(fetchAdminApplicationDetail(id));
            } else {
              throw new Error(parseApiError(resultAction.payload));
            }
          }}
        />
      </AdminLayout>
    </AuthGuard>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col">
      <span className="mb-0.5 text-[10px] font-bold uppercase tracking-tight text-slate-400">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-900">
        {value || "-"}
      </span>
    </div>
  );
}

function NoteBox({
  label,
  text,
  color,
}: {
  label: string;
  text: string;
  color: string;
}) {
  const themes: any = {
    slate: "bg-slate-50 border-slate-100 text-slate-700",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    rose: "bg-rose-50 border-rose-100 text-rose-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${themes[color] || themes.slate}`}>
      <p className="mb-1 text-[9px] font-black uppercase tracking-widest opacity-60">
        {label}
      </p>
      <p className="text-sm font-medium leading-relaxed">{text}</p>
    </div>
  );
}
