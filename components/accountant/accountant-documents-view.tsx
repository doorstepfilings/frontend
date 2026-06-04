"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchAccountantDashboard } from "@/lib/features/accountant/accountant-slice";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { isClientDocument } from "@/lib/utils/document-helpers";
import { AccountantDocumentList } from "./accountant-document-list";
import { apiClient } from "@/lib/api/client";
import { toast } from "react-hot-toast";
import { SearchSelect } from "@/components/ui/core/search-select";

function getRequestDocuments(request: any) {
    const snakeCaseDocuments = Array.isArray(request?.request_documents)
        ? request.request_documents
        : [];
    const camelCaseDocuments = Array.isArray(request?.requestDocuments)
        ? request.requestDocuments
        : [];

    if (snakeCaseDocuments.length === 0) {
        return camelCaseDocuments;
    }

    if (camelCaseDocuments.length === 0) {
        return snakeCaseDocuments;
    }

    const documentsByKey = new Map<string, any>();

    [...snakeCaseDocuments, ...camelCaseDocuments].forEach((doc, index) => {
        const key = String(
            doc?.id ??
            doc?.file_url ??
            doc?.fileUrl ??
            doc?.file_path ??
            doc?.filePath ??
            doc?.file_name ??
            doc?.fileName ??
            `document-${index}`,
        );

        documentsByKey.set(key, { ...(documentsByKey.get(key) || {}), ...doc });
    });

    return Array.from(documentsByKey.values());
}

function normalizeAccountantDocument(doc: any, request: any) {
    return {
        ...doc,
        document_name: doc.document_name ?? doc.documentName ?? null,
        document_type: doc.document_type ?? doc.documentType ?? null,
        document_category: doc.document_category ?? doc.documentCategory ?? null,
        file_name: doc.file_name ?? doc.fileName ?? null,
        file_url: doc.file_url ?? doc.fileUrl ?? doc.file_path ?? doc.filePath ?? null,
        file_size: doc.file_size ?? doc.fileSize ?? null,
        mime_type: doc.mime_type ?? doc.mimeType ?? null,
        created_at: doc.created_at ?? doc.createdAt ?? doc.uploaded_at ?? doc.uploadedAt ?? null,
        uploaded_by: doc.uploaded_by ?? doc.uploadedBy ?? null,
        clientName: request.user?.name,
        serviceName: request.service?.name,
        serviceId: request.service?.id,
        requestId: request.id,
        requestStatus: request.status,
    };
}

function isAccountantReviewDocument(doc: any) {
    const type = String(doc.document_type ?? doc.documentType ?? "").toLowerCase();
    const category = String(doc.document_category ?? doc.documentCategory ?? "").toLowerCase();

    if (["internal", "internal_only", "internal_document"].includes(type)) {
        return false;
    }

    if (["internal", "internal_document"].includes(category)) {
        return false;
    }

    if (type === "client" || type === "client_document") {
        return true;
    }

    if (["client_document", "client_visible", "certificate", "report", "other"].includes(category)) {
        return true;
    }

    return isClientDocument(doc);
}

export function AccountantDocumentsView() {
    const dispatch = useAppDispatch();
    const { serviceRequests, loading } = useAppSelector((state) => state.accountant);
    
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [serviceFilter, setServiceFilter] = useState("all");
    const [activeTab, setActiveTab] = useState<"client" | "internal">("client");

    useEffect(() => {
        dispatch(fetchAccountantDashboard());
    }, [dispatch]);

    const allDocs = useMemo(() => {
        return serviceRequests.flatMap((req: any) => {
            return getRequestDocuments(req).map((doc: any) =>
                normalizeAccountantDocument(doc, req),
            );
        });
    }, [serviceRequests]);

    const uniqueServices = useMemo(() => {
        const services = new Map();
        allDocs.forEach(doc => {
            if (doc.serviceId && !services.has(doc.serviceId)) {
                services.set(doc.serviceId, doc.serviceName);
            }
        });
        return Array.from(services.entries()).map(([id, name]) => ({ id, name }));
    }, [allDocs]);

    const filteredDocs = useMemo(() => {
        return allDocs.filter((doc) => {
            const matchesSearch = !search || 
                doc.file_name?.toLowerCase().includes(search.toLowerCase()) ||
                doc.clientName?.toLowerCase().includes(search.toLowerCase()) ||
                doc.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
                doc.document_type?.toLowerCase().includes(search.toLowerCase());
            
            const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
            const matchesService = serviceFilter === "all" || String(doc.serviceId) === serviceFilter;
            
            return matchesSearch && matchesStatus && matchesService;
        });
    }, [allDocs, search, statusFilter, serviceFilter]);

    const clientDocs = useMemo(
        () => filteredDocs.filter((doc) => isAccountantReviewDocument(doc)),
        [filteredDocs],
    );
    const internalDocs = useMemo(
        () => filteredDocs.filter((doc) => !isAccountantReviewDocument(doc)),
        [filteredDocs],
    );

    const stats = useMemo(() => ({
        total: allDocs.length,
        pending: allDocs.filter(d => d.status === "pending").length,
        verified: allDocs.filter(d => ["verified", "approved"].includes(d.status)).length,
        final: allDocs.filter(d => d.is_final).length
    }), [allDocs]);

    const handleDeleteDoc = async (docId: string | number, requestId: string | number) => {
        try {
            await apiClient.delete(`/accountant/service-requests/${requestId}/documents/${docId}`);
            toast.success("Artifact purged");
            dispatch(fetchAccountantDashboard());
        } catch (err) {
            toast.error("Purge failed");
        }
    };

    const handleUpdateDocStatus = async (doc: any, status: string) => {
        try {
            await apiClient.patch(`/accountant/service-requests/${doc.requestId}/documents/${doc.id}/status`, { status });
            toast.success("Status updated");
            dispatch(fetchAccountantDashboard());
        } catch (err) {
            toast.error("Update failed");
        }
    };

    return (
        <AuthGuard allowedRoles={["accountant"]}>
            <AdminLayout>
                <div className="space-y-10 pb-24 px-2">
                    {/* Professional Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Document Hub</h1>
                        <p className="text-sm text-slate-500 mt-1">Centralized management of all client and internal service artifacts.</p>
                    </div>

                    {/* Clean Stat Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Dossiers</p>
                            <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.total}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                            <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest mb-2">Review Queue</p>
                            <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.pending}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                            <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mb-2">Verified Assets</p>
                            <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.verified}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                            <p className="text-[10px] font-bold text-blue-500/60 uppercase tracking-widest mb-2">Final Outputs</p>
                            <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.final}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                        {/* High-End Filtering Bar */}
                        <div className="p-8 border-b border-slate-100 bg-slate-50/30 space-y-6">
                            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                                <div className="relative w-full lg:max-w-md">
                                    <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                    <input 
                                        type="text"
                                        placeholder="Filter by name, client, or type..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full h-12 pl-12 pr-6 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 transition-all shadow-sm"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                                    <SearchSelect
                                        options={[
                                            { value: "all", label: "All Service Tracks" },
                                            ...uniqueServices.map((service) => ({
                                                value: String(service.id),
                                                label: String(service.name ?? ""),
                                            })),
                                        ]}
                                        value={serviceFilter}
                                        onChange={setServiceFilter}
                                        searchable={uniqueServices.length > 6}
                                        triggerClassName="h-12 min-w-[180px] rounded-xl px-6 py-3"
                                        valueLabelClassName="text-[11px] font-bold uppercase tracking-wide text-slate-600"
                                        handleClassName="h-7 w-7 rounded-md border-0 bg-transparent text-slate-400"
                                        selectStyle={{ borderColor: "#e2e8f0", boxShadow: "0 1px 2px rgba(15,23,42,0.05)" }}
                                    />

                                    <SearchSelect
                                        options={[
                                            { value: "all", label: "Lifecycle Status" },
                                            { value: "pending", label: "Review Pending" },
                                            { value: "verified", label: "Verified" },
                                            { value: "rejected", label: "Rejected" },
                                        ]}
                                        value={statusFilter}
                                        onChange={setStatusFilter}
                                        triggerClassName="h-12 rounded-xl px-6 py-3"
                                        valueLabelClassName="text-[11px] font-bold uppercase tracking-wide text-slate-600"
                                        handleClassName="h-7 w-7 rounded-md border-0 bg-transparent text-slate-400"
                                        selectStyle={{ borderColor: "#e2e8f0", boxShadow: "0 1px 2px rgba(15,23,42,0.05)" }}
                                    />
                                </div>
                            </div>

                            {/* Consistent Tab Switcher */}
                            <div className="flex p-1.5 bg-slate-200/50 rounded-2xl w-fit">
                                <button 
                                    onClick={() => setActiveTab("client")}
                                    className={`px-8 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all ${activeTab === "client" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    Client Pool ({clientDocs.length})
                                </button>
                                <button 
                                    onClick={() => setActiveTab("internal")}
                                    className={`px-8 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all ${activeTab === "internal" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    Internal Pool ({internalDocs.length})
                                </button>
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="p-8 lg:p-10 animate-in fade-in duration-700">
                            <AccountantDocumentList 
                                title={activeTab === "client" ? "Global Client Artifacts" : "Operational Records"}
                                documents={activeTab === "client" ? clientDocs : internalDocs}
                                onDelete={(docId) => {
                                    const doc = allDocs.find(d => d.id === docId);
                                    if (doc) handleDeleteDoc(docId, doc.requestId);
                                }}
                                onUpdateStatus={activeTab === "client" ? handleUpdateDocStatus : undefined}
                                canUpload={false}
                            />
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
