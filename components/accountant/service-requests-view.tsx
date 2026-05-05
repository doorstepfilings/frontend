"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchAccountantDashboard } from "@/lib/features/accountant/accountant-slice";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { StatusIndicator } from "@/components/ui/status-indicator";
import Link from "next/link";
import { buildCollectionKey } from "@/lib/utils/list-keys";
import { format } from "date-fns";

const TABS = [
    { id: 'all', label: 'All Requests', icon: 'fa-list-ul', statuses: [] },
    { id: 'new', label: 'New Assigned', icon: 'fa-plus-circle', statuses: ['applied'] },
    { id: 'ongoing', label: 'Ongoing Work', icon: 'fa-spinner', statuses: ['in_progress', 'under_review', 'document_collection', 'paid'] },
    { id: 'action', label: 'Action Required', icon: 'fa-exclamation-triangle', statuses: ['update_required'] },
    { id: 'review', label: 'Admin Review', icon: 'fa-search', statuses: ['submitted_to_ca'] },
    { id: 'completed', label: 'Completed', icon: 'fa-check-double', statuses: ['completed', 'approved'] },
    { id: 'rejected', label: 'Rejected', icon: 'fa-ban', statuses: ['rejected', 'cancelled'] },
];

export function AccountantServiceRequestsView() {
    const dispatch = useAppDispatch();
    const { serviceRequests, loading } = useAppSelector((state) => state.accountant);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        dispatch(fetchAccountantDashboard());
    }, [dispatch]);

    const filteredRequests = useMemo(() => {
        return serviceRequests.filter((req: any) => {
            const tab = TABS.find(t => t.id === activeTab);
            const matchesTab = activeTab === 'all' || tab?.statuses.includes(req.status);
            const matchesSearch = !searchQuery || 
                req.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                req.service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                req.application_unique_id?.toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesTab && matchesSearch;
        });
    }, [serviceRequests, activeTab, searchQuery]);

    return (
        <AuthGuard allowedRoles={["accountant"]}>
            <AdminLayout>
                <div className="space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Service Pipeline</h1>
                        <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Manage new assignments and ongoing service workflows.</p>
                    </div>

                    {/* Tabs & Search */}
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-3 p-2 bg-slate-100 rounded-[2rem] w-fit">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-6 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === tab.id
                                            ? "bg-white text-blue-600 shadow-lg shadow-slate-200"
                                            : "text-slate-400 hover:text-slate-600"
                                    }`}
                                >
                                    <i className={`fas ${tab.icon} text-sm`}></i>
                                    {tab.label}
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] ${activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                        {tab.id === 'all' ? serviceRequests.length : serviceRequests.filter((r: any) => tab.statuses.includes(r.status)).length}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="relative group max-w-md">
                            <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
                            <input 
                                type="text" 
                                placeholder="Search by client, service..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Content Table */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Docs</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Last Activity</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto"></div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Pipeline...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-32 text-center">
                                                <i className="fas fa-folder-open text-5xl text-slate-100 mb-6 block"></i>
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching requests found</p>
                                            </td>
                                        </tr>
                                    ) : filteredRequests.map((req: any, index: number) => (
                                        <tr
                                            key={buildCollectionKey(req, index, "accountant-pipeline-request", [
                                                req.user?.email,
                                                req.service?.name,
                                            ])}
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <h4 className="text-sm font-black text-slate-900 mb-1">{req.service?.name}</h4>
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-widest">
                                                    {req.service?.category?.name || 'Standard'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                                                        {req.user?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 leading-none mb-1">{req.user?.name}</p>
                                                        <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{req.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <p className="text-[9px] font-mono font-bold text-blue-600 mb-1">#{req.application_unique_id || req.id}</p>
                                                    <StatusIndicator status={req.status} />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-400">
                                                    <i className="fas fa-file-alt"></i>
                                                    {req.request_documents?.length || 0}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <p className="text-[11px] font-bold text-slate-500">
                                                    {(() => {
                                                        const date = req.updated_at || req.created_at;
                                                        if (!date) return '—';
                                                        const d = new Date(date);
                                                        return isNaN(d.getTime()) ? '—' : format(d, 'dd MMM');
                                                    })()}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Link 
                                                    href={`/accountant/service-requests/${req.id}`}
                                                    className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all inline-flex items-center gap-2 shadow-lg shadow-slate-900/10"
                                                >
                                                    PROCESS TASK
                                                    <i className="fas fa-chevron-right text-[8px]"></i>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
