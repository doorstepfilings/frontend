"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { 
    fetchAdminApplicationDetail, 
    deleteDocument, 
    updateDocumentStatus 
} from "@/lib/features/admin/admin-slice";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { toast } from "react-hot-toast";
import { StatusManagement } from "./status-management";
import { FormDataRenderer } from "@/components/ui/form-data-renderer";
import { AccountantDocumentList } from "@/components/accountant/accountant-document-list";
import { splitDocumentsByOwner } from "@/lib/utils/document-helpers";

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
            toast.success("Document status updated");
            dispatch(fetchAdminApplicationDetail(id));
        } else {
            toast.error("Failed to update status");
        }
    };

    if (loading || !app) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="flex flex-col items-center gap-6">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-xl"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Loading Application Details...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const hasNotes = app.notes || app.ca_notes || app.update_note || app.rejection_reason;
    const requestDocuments = Array.isArray(app.request_documents) ? app.request_documents : [];
    const { clientDocs, internalDocs } = splitDocumentsByOwner(requestDocuments, app.user?.id);

    return (
        <AuthGuard allowedRoles={["super_admin"]}>
            <AdminLayout>
                <div className="max-w-6xl mx-auto space-y-6 pb-24 px-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link 
                                href="/admin/service-applications"
                                className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 shadow-sm transition-all hover:bg-slate-50"
                            >
                                <i className="fas fa-arrow-left"></i>
                            </Link>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Application #{app.application_unique_id || app.id}</h1>
                                    <StatusIndicator status={app.status} size="lg" />
                                </div>
                                <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    <span>{app.service?.name}</span>
                                    <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                                    <span>Date: {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}</span>
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
                        {/* Left: Core Information */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Information Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InfoCard title="Client Details" icon="fa-user">
                                    <div className="space-y-4 mt-6">
                                        <DetailItem label="Full Name" value={app.user?.name} />
                                        <DetailItem label="Email" value={app.user?.email} />
                                        <DetailItem label="Mobile" value={app.user?.mobile_number || 'N/A'} />
                                    </div>
                                </InfoCard>
                                <InfoCard title="Service Details" icon="fa-file-invoice">
                                    <div className="space-y-4 mt-6">
                                        <DetailItem label="Service" value={app.service?.name} />
                                        <DetailItem label="Category" value={app.service?.category?.name} />
                                        <DetailItem label="Fees" value={`₹${Math.round(app.amount).toLocaleString('en-IN')}`} />
                                    </div>
                                </InfoCard>
                            </div>

                            {/* Additional Information (Form Data) */}
                            <FormDataRenderer 
                                formData={app.form_data} 
                                title="Application Details" 
                                icon="fa-file-alt" 
                            />

                            {/* Documents Section */}
                            <div className="space-y-6">
                                <AccountantDocumentList 
                                    title="Client Documents"
                                    documents={clientDocs}
                                    onDelete={() => {}} 
                                    onUpdateStatus={handleUpdateDocStatus}
                                    canUpload={false}
                                />
                                <AccountantDocumentList 
                                    title="Internal Documents"
                                    documents={internalDocs}
                                    onDelete={() => {}} 
                                    onUpdateStatus={handleUpdateDocStatus}
                                    canUpload={false}
                                />
                            </div>

                            {/* Notes & Remarks */}
                            {hasNotes && (
                                <InfoCard title="Internal Notes" icon="fa-comment-dots">
                                    <div className="grid grid-cols-1 gap-4 mt-8">
                                        {app.notes && (
                                            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Client Notes</p>
                                                <p className="text-sm font-medium text-slate-700 leading-relaxed">{app.notes}</p>
                                            </div>
                                        )}
                                        {app.ca_notes && (
                                            <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Accountant Memo</p>
                                                <p className="text-sm font-medium text-blue-700 leading-relaxed">{app.ca_notes}</p>
                                            </div>
                                        )}
                                        {app.update_note && (
                                            <div className="p-6 bg-amber-50 rounded-xl border border-amber-100">
                                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">Update Request</p>
                                                <p className="text-sm font-medium text-amber-700 leading-relaxed">{app.update_note}</p>
                                            </div>
                                        )}
                                        {app.rejection_reason && (
                                            <div className="p-6 bg-rose-50 rounded-xl border border-rose-100">
                                                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2">Rejection Reason</p>
                                                <p className="text-sm font-medium text-rose-700 leading-relaxed">{app.rejection_reason}</p>
                                            </div>
                                        )}
                                    </div>
                                </InfoCard>
                            )}
                        </div>

                        {/* Right: Lifecycle & Transitions */}
                        <div className="space-y-10">
                            <StatusManagement application={app} />
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}

function InfoCard({ title, icon, children }: any) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                    <i className={`fas ${icon} text-sm`}></i>
                </div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function DetailItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="group">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm font-semibold text-slate-900 leading-tight">{value || '—'}</p>
        </div>
    );
}
