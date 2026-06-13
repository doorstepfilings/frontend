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
import { LogoLoader } from "@/components/ui/logo-loader";

const TABS = [
    { id: 'all', label: 'All Requests', icon: 'fa-list-ul', statuses: [] },
    { id: 'new', label: 'New Assigned', icon: 'fa-plus-circle', statuses: ['applied'] },
    { id: 'ongoing', label: 'Ongoing Work', icon: 'fa-spinner', statuses: ['in_progress', 'under_review', 'document_collection'] },
    { id: 'action', label: 'Action Required', icon: 'fa-exclamation-triangle', statuses: ['update_required'] },
    { id: 'review', label: 'Admin Review', icon: 'fa-search', statuses: ['approved'] },
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
                <div className="space-y-10 pb-20 px-2">
                    {/* Professional Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Service Pipeline</h1>
                            <p className="text-sm text-slate-500 mt-1">Lifecycle management for active service workflows.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative group w-full md:w-72">
                                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                                <input 
                                    type="text" 
                                    placeholder="Quick Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 border border-transparent rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-200 transition-all shadow-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Clean Tab System */}
                    <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit">
                        {TABS.map((tab) => {
                            const count = tab.id === 'all' ? serviceRequests.length : serviceRequests.filter((r: any) => tab.statuses.includes(r.status)).length;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                                        activeTab === tab.id
                                            ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                    }`}
                                >
                                    <i className={`fas ${tab.icon} opacity-50`}></i>
                                    {tab.label}
                                    {count > 0 && (
                                        <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Simplified Table Content */}
                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Detail</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Identity</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Assets</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Updated</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-24 text-center">
                                                <LogoLoader size={48} label="Loading Pipeline..." />
                                            </td>
                                        </tr>
                                    ) : filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-32 text-center">
                                                <p className="text-sm font-medium text-slate-400">No records found for this selection</p>
                                            </td>
                                        </tr>
                                    ) : filteredRequests.map((req: any, index: number) => (
                                        <tr
                                            key={buildCollectionKey(req, index, "accountant-pipeline-request", [
                                                req.user?.email,
                                                req.service?.name,
                                            ])}
                                            className="hover:bg-slate-50/40 transition-all group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="max-w-[200px]">
                                                    <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1">{req.service?.name}</h4>
                                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                                        {req.service?.category?.name || 'Standard'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                                        {req.user?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 mb-0.5">{req.user?.name}</p>
                                                        <p className="text-[11px] font-medium text-slate-400">{req.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-[10px] font-mono font-bold text-slate-400">#{req.application_unique_id || req.id}</span>
                                                    <StatusIndicator status={req.status} />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg text-xs font-bold text-slate-600 border border-slate-100">
                                                    <i className="far fa-file-alt opacity-50"></i>
                                                    {req.request_documents?.length || 0}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <p className="text-xs font-bold text-slate-700">
                                                    {(() => {
                                                        const date = req.updated_at || req.created_at;
                                                        if (!date) return '---';
                                                        const d = new Date(date);
                                                        return isNaN(d.getTime()) ? '---' : format(d, 'MMM dd');
                                                    })()}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Link 
                                                    href={`/accountant/service-requests/${req.id}`}
                                                    className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wide hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-sm"
                                                >
                                                    Process
                                                    <i className="fas fa-arrow-right text-[10px] opacity-50 group-hover:translate-x-0.5 transition-transform"></i>
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
