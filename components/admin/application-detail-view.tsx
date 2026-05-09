"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { 
    fetchAdminApplicationDetail, 
    updateDocumentStatus 
} from "@/lib/features/admin/admin-slice";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { toast } from "react-hot-toast";
import { StatusManagement } from "./status-management";
import { FormDataRenderer } from "@/components/ui/form-data-renderer";
import { AccountantDocumentList } from "@/components/accountant/accountant-document-list";
import { splitDocumentsByOwner } from "@/lib/utils/document-helpers";
import { format } from "date-fns";

const STATUS_CONFIG: any = {
    draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600', icon: 'fa-file-edit' },
    pending: { label: 'Reviewing', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: 'fa-search' },
    update_required: { label: 'Action Needed', color: 'bg-rose-50 text-rose-700 border-rose-100', icon: 'fa-exclamation-circle' },
    approved: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: 'fa-check-double' },
    rejected: { label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-100', icon: 'fa-times-circle' },
    cancelled: { label: 'Cancelled', color: 'bg-slate-50 text-slate-500 border-slate-100', icon: 'fa-ban' },
    in_progress: { label: 'Processing', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: 'fa-spinner' },
    paid: { label: 'Payment Verified', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: 'fa-wallet' },
    completed: { label: 'Success', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: 'fa-flag-checkered' },
    applied: { label: 'New Arrival', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: 'fa-sparkles' },
    submitted_to_ca: { label: 'Sent to CA', color: 'bg-cyan-50 text-cyan-700 border-cyan-100', icon: 'fa-paper-plane' },
    under_review: { label: 'Verifying', color: 'bg-purple-50 text-purple-700 border-purple-100', icon: 'fa-user-check' },
    document_collection: { label: 'Docs Needed', color: 'bg-orange-50 text-orange-700 border-orange-100', icon: 'fa-folder-open' },
};

export function ApplicationDetailView() {
    const params = useParams();
    const id = params?.id as string;
    
    const dispatch = useAppDispatch();
    const { selectedApplication: app, loading } = useAppSelector((state) => state.admin);

    useEffect(() => {
        if (id) {
            dispatch(fetchAdminApplicationDetail(id));
        }
    }, [id, dispatch]);

    const handleUpdateDocStatus = async (doc: any, status: string, remark?: string) => {
        const resultAction = await dispatch(updateDocumentStatus({ 
            applicationId: id, 
            docId: doc.id, 
            status,
            remark
        }));
        if (updateDocumentStatus.fulfilled.match(resultAction)) {
            toast.success("Document updated");
            dispatch(fetchAdminApplicationDetail(id));
        } else {
            toast.error("Update failed");
        }
    };

    if (loading || !app) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Loading details...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const { clientDocs, internalDocs } = splitDocumentsByOwner(app.request_documents || [], app.user?.id);
    const statusConfig = STATUS_CONFIG[app.status] || { label: app.status, color: 'bg-slate-100 text-slate-600', icon: 'fa-info-circle' };

    return (
        <AuthGuard allowedRoles={["super_admin"]}>
            <AdminLayout>
                <div className="max-w-6xl mx-auto space-y-8 pb-24">
                    {/* Professional Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                        <div className="flex items-center gap-5">
                            <Link 
                                href="/admin/service-applications"
                                className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 shadow-sm transition-all"
                            >
                                <i className="fas fa-chevron-left text-xs"></i>
                            </Link>
                            <div>
                                <div className="flex items-center gap-4">
                                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order #{app.application_unique_id || app.id}</h1>
                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusConfig.color}`}>
                                        <i className={`fas ${statusConfig.icon} text-[9px]`}></i>
                                        {statusConfig.label}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 font-medium mt-1">{app.service?.name}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                             <button className="h-10 px-5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                                <i className="fas fa-file-pdf text-xs text-rose-500"></i> Export PDF
                             </button>
                             <button className="h-10 px-5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2">
                                <i className="fas fa-print text-xs"></i> Print
                             </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content Area */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InfoSection title="Client Profile" icon="fa-user-circle">
                                    <div className="space-y-4">
                                        <DetailRow label="Name" value={app.user?.name} />
                                        <DetailRow label="Email Address" value={app.user?.email} />
                                        <DetailRow label="Contact Number" value={app.user?.mobile_number} />
                                    </div>
                                </InfoSection>

                                <InfoSection title="Financial Snapshot" icon="fa-credit-card">
                                    <div className="space-y-4">
                                        <DetailRow label="Service Fee" value={`₹${Math.round(app.amount).toLocaleString('en-IN')}`} />
                                        <DetailRow label="Payment Status" value={app.status === 'paid' ? 'Paid' : 'Pending'} />
                                        <DetailRow label="Date Received" value={app.created_at ? format(new Date(app.created_at), 'dd MMM yyyy') : '—'} />
                                    </div>
                                </InfoSection>
                            </div>

                            {/* Application Data */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <FormDataRenderer 
                                    formData={app.form_data} 
                                    title="Application Data" 
                                    icon="fa-database" 
                                />
                            </div>

                            {/* Document Management */}
                            <div className="space-y-6">
                                <AccountantDocumentList 
                                    title="Client Submission Documents"
                                    documents={clientDocs}
                                    onDelete={() => {}} 
                                    onUpdateStatus={handleUpdateDocStatus}
                                    canUpload={false}
                                />
                                <AccountantDocumentList 
                                    title="Internal Verification Documents"
                                    documents={internalDocs}
                                    onDelete={() => {}} 
                                    onUpdateStatus={handleUpdateDocStatus}
                                    canUpload={false}
                                />
                            </div>

                            {/* Remarks & Notes History */}
                            <InfoSection title="Communication Log" icon="fa-history">
                                <div className="space-y-4">
                                    {!app.notes && !app.ca_notes && !app.rejection_reason && (
                                        <p className="text-sm text-slate-400 italic">No notes or remarks found for this order.</p>
                                    )}
                                    {app.notes && (
                                        <NoteBox label="Client Instruction" text={app.notes} color="slate" />
                                    )}
                                    {app.ca_notes && (
                                        <NoteBox label="Internal Note" text={app.ca_notes} color="blue" />
                                    )}
                                    {app.rejection_reason && (
                                        <NoteBox label="Reason for Rejection" text={app.rejection_reason} color="rose" />
                                    )}
                                </div>
                            </InfoSection>
                        </div>

                        {/* Sidebar: Lifecycle Control */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Process Management</h3>
                                <StatusManagement application={app} />
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}

function InfoSection({ title, icon, children }: any) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center">
                    <i className={`fas ${icon} text-xs`}></i>
                </div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function DetailRow({ label, value }: { label: string, value?: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">{label}</span>
            <span className="text-sm font-semibold text-slate-900">{value || '—'}</span>
        </div>
    );
}

function NoteBox({ label, text, color }: { label: string, text: string, color: string }) {
    const themes: any = {
        slate: 'bg-slate-50 border-slate-100 text-slate-700',
        blue: 'bg-blue-50 border-blue-100 text-blue-700',
        rose: 'bg-rose-50 border-rose-100 text-rose-700',
    };
    return (
        <div className={`p-4 rounded-xl border ${themes[color] || themes.slate}`}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">{label}</p>
            <p className="text-sm font-medium leading-relaxed">{text}</p>
        </div>
    );
}
