"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { apiClient } from "@/lib/api/client";
import { toast } from "react-hot-toast";
import { splitDocumentsByOwner } from "@/lib/utils/document-helpers";
import { AccountantDocumentList } from "./accountant-document-list";
import { AccountantUploadForm } from "./accountant-upload-form";
import { FormDataRenderer } from "@/components/ui/form-data-renderer";
import { Modal } from "@/components/ui/modal";
import { FormSelect, FormTextarea } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";

const STEPS = ["applied", "under_review", "in_progress", "submitted_to_ca", "completed"];
const STATUS_LABELS: any = {
  applied: "New Application",
  under_review: "Verifying Documents",
  in_progress: "Processing Task",
  submitted_to_ca: "Pending CA Approval",
  approved: "Completed",
  completed: "Completed",
  rejected: "Rejected",
  update_required: "Information Required",
  cancelled: "Cancelled",
  pending: "Submitted",
};

export function AccountantRequestDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
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
  const [activeDocTab, setActiveDocTab] = useState<"client" | "internal">("client");
  const [revisionNotes, setRevisionNotes] = useState("");

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
    if (id) fetchData();
  }, [id]);

  const stepIndex = useMemo(() => {
    if (!req?.status) return 0;
    if (req.status === "update_required" || req.status === "rejected") return 0;
    if (req.status === "approved" || req.status === "completed") return 4;
    const idx = STEPS.indexOf(req.status);
    return idx >= 0 ? idx : 0;
  }, [req?.status]);

  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  const handleUpdateStatus = async (eOrData?: React.FormEvent | { status: string }) => {
    let data: any = statusForm;
    
    // Check if it's a direct data object or a form event
    if (eOrData && typeof eOrData === 'object' && 'status' in eOrData) {
      data = eOrData;
    } else if (eOrData) {
      (eOrData as React.FormEvent).preventDefault();
    }

    if (!data.status) return toast.error("Please select a target status");
    
    setUpdating(true);
    try {
      await apiClient.patch(`/accountant/service-requests/${id}/status`, data);
      toast.success("Workflow stage recalibrated");
      setShowStatusModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleRevisionSubmit = async () => {
    if (!revisionNotes.trim()) return toast.error("Description of updates is mandatory");
    setUpdating(true);
    try {
      await apiClient.post(`/accountant/service-requests/${id}/revision`, { notes: revisionNotes });
      toast.success("Revision committed to review");
      setRevisionNotes("");
      fetchData();
    } catch (error: any) {
      toast.error("Revision commit failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteDoc = async (docId: string | number) => {
    try {
      await apiClient.delete(`/accountant/service-requests/${id}/documents/${docId}`);
      toast.success("Artifact purged from archives");
      fetchData();
    } catch (err) {
      toast.error("Purge failed");
    }
  };

  const handleUpdateDocStatus = async (doc: any, status: string) => {
    try {
      await apiClient.patch(`/accountant/service-requests/${id}/documents/${doc.id}/status`, { status });
      toast.success("Artifact status updated");
      fetchData();
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  if (loading || !req) {
    return (
      <AdminLayout>
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-xl"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Accessing Work Order...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { clientDocs, internalDocs } = splitDocumentsByOwner(req.request_documents || [], req.user?.id);
  const canRevise = req.status === "update_required";
  const canUpload = req.status !== "cancelled" && req.status !== "approved";

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
               <button className="h-10 px-5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                <i className="fas fa-print opacity-50"></i> Export Dossier
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              {/* Refined Progress Tracker */}
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-10">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Processing Roadmap</h3>
                  <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold">
                    Stage {stepIndex + 1} of {STEPS.length}
                  </div>
                </div>

                <div className="relative px-2">
                  <div className="absolute top-[1.125rem] left-10 right-10 h-0.5 bg-slate-100" />
                  <div
                    className="absolute top-[1.125rem] left-10 h-0.5 bg-slate-900 transition-all duration-1000"
                    style={{ width: `calc((100% - 5rem) * ${stepIndex / (STEPS.length - 1)})` }}
                  />

                  <div className="relative z-10 flex justify-between">
                    {STEPS.map((step, i) => (
                      <div key={step} className="flex flex-col items-center gap-4">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 ${
                          i <= stepIndex ? "bg-white border-slate-900 text-slate-900 shadow-sm" : "bg-white border-slate-100 text-slate-200"
                        }`}>
                          {i < stepIndex ? <i className="fas fa-check text-[10px]" /> : i + 1}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wide text-center max-w-[80px] ${i <= stepIndex ? "text-slate-900" : "text-slate-300"}`}>
                          {STATUS_LABELS[step]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
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
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Internal Directives</h3>
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
                      <h3 className="text-lg font-bold text-rose-900 tracking-tight">Correction Required</h3>
                      <p className="text-sm text-rose-700/70 mt-1 font-medium">{req.update_note || req.revision_notes || "Client needs to address specific discrepancies."}</p>
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
                      {updating ? <i className="fas fa-spinner fa-spin" /> : "Commit Corrections"}
                    </button>
                  </div>
                </div>
              )}

              {/* Document Repository */}
              <div className="space-y-8">
                {canUpload && (
                  <AccountantUploadForm 
                    requestId={id} 
                    onSuccess={fetchData} 
                    showFinalToggle={req.status === "in_progress"}
                  />
                )}

                {/* Repository Filter */}
                <div className="flex p-1.5 bg-slate-100/80 rounded-2xl">
                  <button 
                    onClick={() => setActiveDocTab("client")}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all ${activeDocTab === "client" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Client Submissions ({clientDocs.length})
                  </button>
                  <button 
                    onClick={() => setActiveDocTab("internal")}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all ${activeDocTab === "internal" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Internal Repository ({internalDocs.length})
                  </button>
                </div>

                <div className="animate-in fade-in duration-500">
                  <AccountantDocumentList 
                    title={activeDocTab === "client" ? "Client Documents" : "Internal Documents"}
                    documents={activeDocTab === "client" ? clientDocs : internalDocs}
                    onDelete={handleDeleteDoc}
                    onUpdateStatus={activeDocTab === "client" ? handleUpdateDocStatus : undefined}
                  />
                </div>
              </div>
            </div>

            {/* Strategic Controls */}
            <div className="space-y-10">
              {/* Task Management */}
              <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-8">Management</h3>
                
                {["completed", "approved", "submitted_to_ca"].includes(req.status) && (
                  <div className="mb-8">
                    <div className={`p-4 rounded-2xl border text-center ${req.status === 'submitted_to_ca' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                      <p className="text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <i className={`fas ${req.status === 'submitted_to_ca' ? 'fa-hourglass-half' : 'fa-check-circle'}`}></i>
                        {req.status === 'submitted_to_ca' ? 'Review Pending' : 'Workflow Finalized'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {(req.status === "applied" || req.status === "paid") && (
                      <button 
                        onClick={() => handleUpdateStatus({ status: "under_review" })}
                        className="w-full h-12 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm"
                      >
                        Initiate Review
                      </button>
                    )}

                    {req.status === "under_review" && (
                      <>
                        <button 
                          onClick={() => handleUpdateStatus({ status: "in_progress" } as any)}
                          className="w-full h-12 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm"
                        >
                          Approve Docs
                        </button>
                        <button 
                          onClick={() => {
                            setStatusForm({ ...statusForm, status: "update_required" });
                            setShowStatusModal(true);
                          }}
                          className="w-full h-12 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all"
                        >
                          Request Updates
                        </button>
                      </>
                    )}

                    {req.status === "in_progress" && (
                      <button 
                        onClick={() => handleUpdateStatus({ status: "submitted_to_ca" } as any)}
                        className="w-full h-12 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm"
                      >
                        Submit Dossier
                      </button>
                    )}

                    {req.status === "update_required" && (
                      <button 
                        onClick={() => handleUpdateStatus({ status: "under_review" } as any)}
                        className="w-full h-12 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm"
                      >
                        Restart Review
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={() => setShowStatusModal(true)}
                    className="w-full h-10 text-slate-400 hover:text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-slate-100 hover:border-slate-200"
                  >
                    Advanced controls
                  </button>
                </div>
              </div>

              {/* User Context */}
              <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-8">Client Profile</h3>
                <div className="space-y-8">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {req.user?.name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-none mb-1.5">{req.user?.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validated Account</p>
                    </div>
                  </div>
                  <div className="space-y-6 pt-2 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Direct Line</p>
                      <p className="text-sm font-bold text-slate-700">{req.user?.mobile_number || "---"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Base</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{req.user?.email}</p>
                    </div>
                  </div>
                </div>
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
              { value: "submitted_to_ca", label: "Submit to CA/Admin" },
              { value: "update_required", label: "Request Client Correction" },
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
    </AuthGuard>
  );
}
