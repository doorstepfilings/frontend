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
import { PanelLogoLoader } from "@/components/ui/logo-loader";

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

    const formatRequestDate = (req: any) => {
        const date = req.updated_at || req.created_at;
        if (!date) return "---";
        const parsed = new Date(date);
        return isNaN(parsed.getTime()) ? "---" : format(parsed, "MMM dd");
    };

    return (
        <AuthGuard allowedRoles={["accountant"]}>
            <AdminLayout>
                <div className="panel-page">
                    <section className="panel-hero p-5 sm:p-6 lg:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Accountant Panel</p>
                            <h1 className="mt-2 text-3xl font-black text-slate-900 tracking-tight">Service Pipeline</h1>
                            <p className="mt-2 text-sm text-slate-500 font-medium">Lifecycle management and milestone tracking for active services.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative group w-full sm:max-w-full md:w-72">
                                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                                <input 
                                    type="text" 
                                    placeholder="Quick Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="panel-input w-full pl-11 pr-4 text-sm font-medium shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                    </section>

                    {/* Clean Tab System */}
                    <div className="-mx-1 overflow-x-auto px-1 pb-1">
                        <div className="flex min-w-max gap-2 rounded-2xl bg-slate-100/80 p-1.5">
                            {TABS.map((tab) => {
                                const count = tab.id === 'all' ? serviceRequests.length : serviceRequests.filter((r: any) => tab.statuses.includes(r.status)).length;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[11px] font-bold transition-all sm:px-5 ${
                                            activeTab === tab.id
                                                ? "border border-slate-200/50 bg-white text-slate-900 shadow-sm"
                                                : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
                                        }`}
                                    >
                                        <i className={`fas ${tab.icon} opacity-50`}></i>
                                        {tab.label}
                                        {count > 0 && (
                                            <span className={`ml-1 rounded-md px-1.5 py-0.5 text-[9px] ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4 md:hidden">
                        {loading ? (
                            <PanelLogoLoader
                                className="panel-empty-state min-h-[16rem] px-0 py-0 shadow-sm"
                                label="Loading pipeline..."
                                size={54}
                                surfaceClassName="max-w-md"
                            />
                        ) : filteredRequests.length === 0 ? (
                            <div className="panel-empty-state px-6 py-16 text-center shadow-sm">
                                <p className="text-sm font-medium text-slate-400">No records found for this selection</p>
                            </div>
                        ) : filteredRequests.map((req: any, index: number) => (
                            <div
                                key={buildCollectionKey(req, index, "accountant-pipeline-request-mobile", [
                                    req.user?.email,
                                    req.service?.name,
                                ])}
                                className="panel-card p-5"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h4 className="text-base font-bold leading-snug text-slate-900">
                                            {req.service?.name}
                                        </h4>
                                        <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                            {req.service?.category?.name || "Standard"}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[10px] font-mono font-bold text-slate-400">
                                        #{req.application_unique_id || req.id}
                                    </span>
                                </div>

                                <div className="mt-4 flex items-center gap-3.5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-sm">
                                        {req.user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-slate-900">
                                            {req.user?.name}
                                        </p>
                                        <p className="truncate text-[11px] font-medium text-slate-400">
                                            {req.user?.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <StatusIndicator status={req.status} />
                                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600">
                                        <i className="far fa-file-alt opacity-50"></i>
                                        {req.request_documents?.length || 0}
                                    </div>
                                    <p className="text-xs font-bold text-slate-700">
                                        {formatRequestDate(req)}
                                    </p>
                                </div>

                                <Link
                                    href={`/accountant/service-requests/${req.id}`}
                                    className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm transition-all hover:bg-slate-800"
                                >
                                    Process
                                    <i className="fas fa-arrow-right text-[10px] opacity-50"></i>
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* Simplified Table Content */}
                    <div className="panel-table-shell hidden md:block">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="panel-table-head border-b border-slate-100">
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
                                            <td colSpan={6} className="px-8 py-32 text-center">
                                                <PanelLogoLoader
                                                    className="min-h-0 px-0 py-0"
                                                    label="Loading pipeline..."
                                                    size={54}
                                                    surfaceClassName="max-w-md"
                                                />
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
                                                    {formatRequestDate(req)}
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
