"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchAccountantDashboard } from "@/lib/features/accountant/accountant-slice";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { StatCard } from "@/components/dashboard/stat-card";
import { splitDocumentsByOwner } from "@/lib/utils/document-helpers";
import { AccountantDocumentList } from "./accountant-document-list";
import { apiClient } from "@/lib/api/client";
import { toast } from "react-hot-toast";

export function AccountantDocumentsView() {
    const dispatch = useAppDispatch();
    const { serviceRequests, loading } = useAppSelector((state) => state.accountant);
    
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeTab, setActiveTab] = useState<"client" | "internal">("client");

    useEffect(() => {
        dispatch(fetchAccountantDashboard());
    }, [dispatch]);

    const allDocs = useMemo(() => {
        return serviceRequests.flatMap((req: any) => {
            return (req.request_documents || []).map((doc: any) => ({
                ...doc,
                clientName: req.user?.name,
                serviceName: req.service?.name,
                requestId: req.id,
                requestStatus: req.status
            }));
        });
    }, [serviceRequests]);

    const filteredDocs = useMemo(() => {
        return allDocs.filter((doc) => {
            const matchesSearch = !search || 
                doc.file_name?.toLowerCase().includes(search.toLowerCase()) ||
                doc.clientName?.toLowerCase().includes(search.toLowerCase()) ||
                doc.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
                doc.document_type?.toLowerCase().includes(search.toLowerCase());
            
            const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [allDocs, search, statusFilter]);

    const { clientDocs, internalDocs } = splitDocumentsByOwner(filteredDocs, null);

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
                <div className="space-y-10 pb-20">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Document Hub</h1>
                            <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Global repository of all client and operational artifacts</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard label="Total Artifacts" value={stats.total} icon="fa-folder-open" color="slate" />
                        <StatCard label="Pending Review" value={stats.pending} icon="fa-hourglass-half" color="amber" />
                        <StatCard label="Verified Assets" value={stats.verified} icon="fa-check-double" color="emerald" />
                        <StatCard label="Final Deliveries" value={stats.final} icon="fa-paper-plane" color="blue" />
                    </div>

                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 lg:p-12 space-y-10">
                        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                            <div className="relative w-full lg:max-w-md">
                                <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                    type="text"
                                    placeholder="Search by file, client, or service..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-14 pl-16 pr-8 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-8 focus:ring-blue-500/10 outline-none transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-4 w-full lg:w-auto">
                                <select 
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-14 px-8 bg-slate-50 border-none rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-8 focus:ring-blue-500/10 outline-none appearance-none"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="verified">Verified</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                                
                                <div className="flex p-1 bg-slate-50 rounded-2xl">
                                    <button 
                                        onClick={() => setActiveTab("client")}
                                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "client" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}
                                    >
                                        Client ({clientDocs.length})
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab("internal")}
                                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "internal" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}
                                    >
                                        Internal ({internalDocs.length})
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <AccountantDocumentList 
                                title={activeTab === "client" ? "Client-Facing Repository" : "Internal Operations Repository"}
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
