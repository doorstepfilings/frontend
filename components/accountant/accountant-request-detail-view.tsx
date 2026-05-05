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
  const [revisionNotes, setRevisionNotes] = useState("");
  const [activeDocTab, setActiveDocTab] = useState<"client" | "internal">("client");

  const fetchData = async () => {
    try {
      const res = await apiClient.get(`/accountant/service-requests/${id}`);
      setReq(res.data?.data || res.data);
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

  const handleUpdateStatus = async (status: string) => {
    setUpdating(true);
    try {
      await apiClient.patch(`/accountant/service-requests/${id}/status`, { status });
      toast.success("Workflow stage recalibrated");
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
        <div className="max-w-6xl mx-auto space-y-6 pb-24 px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/accountant/service-requests"
                className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 shadow-sm transition-all hover:bg-slate-50"
              >
                <i className="fas fa-arrow-left"></i>
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{req.service?.name}</h1>
                  <StatusIndicator status={req.status} size="lg" />
                </div>
                <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <span>Application #{req.application_unique_id || req.id}</span>
                  <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                  <span>Order ID: {req.id}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
               <button className="h-11 px-6 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                <i className="fas fa-print"></i> Print Details
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Progress Tracker Area */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <i className="fas fa-route text-blue-600" />
                    Application Status
                  </h3>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">
                    {progress}% Complete
                  </span>
                </div>

                <div className="relative px-2">
                  <div className="absolute top-4 left-6 right-6 h-1 bg-slate-100 rounded-full" />
                  <div
                    className="absolute top-4 left-6 h-1 bg-blue-600 transition-all duration-700 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                    style={{ width: `calc((100% - 3rem) * ${stepIndex / (STEPS.length - 1)})` }}
                  />

                  <div className="relative z-10 flex justify-between">
                    {STEPS.map((step, i) => (
                      <div key={step} className="flex flex-col items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                          i <= stepIndex ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-100 text-slate-300"
                        }`}>
                          {i < stepIndex ? <i className="fas fa-check" /> : i + 1}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wide text-center max-w-[80px] ${i <= stepIndex ? "text-slate-900" : "text-slate-400"}`}>
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
                title="Client Application Data" 
                icon="fa-file-alt" 
              />

              {/* Admin Notes */}
              {req.ca_notes && (
                <div className="bg-amber-50 rounded-2xl border border-amber-100 p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white text-amber-600 rounded-xl flex items-center justify-center shadow-sm border border-amber-100">
                      <i className="fas fa-comment-dots" />
                    </div>
                    <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Instructions from Admin</h3>
                  </div>
                  <p className="text-sm font-medium text-amber-800 leading-relaxed">
                    {req.ca_notes}
                  </p>
                </div>
              )}

              {/* Revision Required Section */}
              {canRevise && (
                <div className="bg-rose-50 rounded-2xl border border-rose-100 p-8 shadow-sm">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-white text-rose-600 rounded-xl flex items-center justify-center shadow-sm border border-rose-100 shrink-0">
                      <i className="fas fa-exclamation-circle text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-rose-900 tracking-tight">Update Required</h3>
                      <p className="text-sm text-rose-700 mt-1 font-medium leading-relaxed">{req.update_note || req.revision_notes || "Please check the documents and update the information as requested."}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <textarea
                      rows={3}
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                      placeholder="Enter details about the updates made..."
                      className="w-full bg-white border border-rose-200 rounded-xl p-4 text-sm font-medium focus:ring-4 focus:ring-rose-500/10 outline-none transition-all shadow-inner"
                    />
                    <button
                      onClick={handleRevisionSubmit}
                      disabled={updating || !revisionNotes.trim()}
                      className="w-full h-12 bg-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-rose-700 transition-all shadow-md disabled:opacity-50"
                    >
                      {updating ? <i className="fas fa-spinner fa-spin" /> : "Submit Update"}
                    </button>
                  </div>
                </div>
              )}

              {/* Document Management Section */}
              <div className="space-y-6">
                {canUpload && (
                  <AccountantUploadForm 
                    requestId={id} 
                    onSuccess={fetchData} 
                    showFinalToggle={req.status === "in_progress"}
                  />
                )}

                {/* Tab Switcher */}
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button 
                    onClick={() => setActiveDocTab("client")}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeDocTab === "client" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Client Docs ({clientDocs.length})
                  </button>
                  <button 
                    onClick={() => setActiveDocTab("internal")}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeDocTab === "internal" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Internal Docs ({internalDocs.length})
                  </button>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <AccountantDocumentList 
                    title={activeDocTab === "client" ? "Client Documents" : "Internal Documents"}
                    documents={activeDocTab === "client" ? clientDocs : internalDocs}
                    onDelete={handleDeleteDoc}
                    onUpdateStatus={activeDocTab === "client" ? handleUpdateDocStatus : undefined}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Controls */}
            <div className="space-y-10">
              {/* Action Center */}
              <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl">
                <h3 className="text-lg font-bold tracking-tight mb-6">Workflow Actions</h3>
                
                {["completed", "approved", "submitted_to_ca"].includes(req.status) && (
                  <div className="mb-6">
                    {req.status === "submitted_to_ca" ? (
                      <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 py-4 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center justify-center gap-2">
                          <i className="fas fa-shield-alt"></i> Awaiting Admin Approval
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-4 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center justify-center gap-2">
                          <i className="fas fa-check-double"></i> Application Finalized
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Update Stage
                    </label>
                      <div className="relative">
                        <select 
                          className="w-full h-12 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs font-bold text-white outline-none appearance-none focus:border-blue-500 transition-all"
                          onChange={(e) => {
                            if (e.target.value) handleUpdateStatus(e.target.value);
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Choose status...</option>
                          
                          {/* Forward Transitions */}
                          {req.status === "applied" && (
                            <option value="under_review">Start Verification</option>
                          )}
                          {req.status === "under_review" && (
                            <option value="in_progress">Accept & Start Processing</option>
                          )}
                          {req.status === "in_progress" && (
                            <option value="submitted_to_ca">Submit for Final Approval</option>
                          )}
                          
                          {/* Correction / Info Required */}
                          {["under_review", "in_progress"].includes(req.status) && (
                            <option value="update_required">Request Client Info</option>
                          )}
                          {req.status === "update_required" && (
                            <option value="under_review">Resume Verification</option>
                          )}

                          {/* Backward Transitions */}
                          {req.status === "under_review" && (
                            <option value="applied">Move back to New</option>
                          )}
                          {req.status === "in_progress" && (
                            <option value="under_review">Move back to Review</option>
                          )}
                          {req.status === "submitted_to_ca" && (
                            <option value="in_progress">Return to Processing</option>
                          )}
                          {req.status === "approved" && (
                            <option value="submitted_to_ca">Revoke Approval</option>
                          )}
                          {req.status === "completed" && (
                            <option value="approved">Re-open (Set to Approved)</option>
                          )}

                          <option value="cancelled">Cancel Application</option>
                        </select>
                        <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[10px]"></i>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed px-1">
                      Changing the status will trigger automated notifications and update the client's dashboard.
                    </p>
                  </div>
              </div>

              {/* Client Profile Sidebar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-6">Client Info</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {req.user?.name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-none mb-1">{req.user?.name}</h4>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Verified Client</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <i className="fas fa-phone-alt text-[10px]"></i>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mobile</p>
                        <p className="text-xs font-bold text-slate-700">{req.user?.mobile_number || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <i className="fas fa-envelope text-[10px]"></i>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                        <p className="text-xs font-bold text-slate-700 truncate">{req.user?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
