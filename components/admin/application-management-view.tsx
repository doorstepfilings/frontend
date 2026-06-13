"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchAdminApplications, fetchAccountants, assignAccountantToApplication } from "@/lib/features/admin/admin-slice";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { buildCollectionKey } from "@/lib/utils/list-keys";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { LogoLoader } from "@/components/ui/logo-loader";

import { getStatusConfig } from "@/lib/utils/status-helpers";

const TABS = [
    { id: 'active', label: 'Active Pipeline', icon: 'fa-stream', statuses: ['applied', 'document_collection', 'under_review', 'update_required', 'in_progress', 'payment_pending', 'paid'] },
    { id: 'completed', label: 'Success Board', icon: 'fa-check-circle', statuses: ['completed', 'approved'] },
    { id: 'cancelled', label: 'Archived', icon: 'fa-archive', statuses: ['rejected', 'cancelled'] },
];

export function ApplicationManagementView() {
    const dispatch = useAppDispatch();
    const { applications, accountants, loading } = useAppSelector((state) => state.admin);
    const [activeTab, setActiveTab] = useState('active');
    const [searchQuery, setSearchQuery] = useState("");
    const [assigningId, setAssigningId] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchAdminApplications());
        dispatch(fetchAccountants());
    }, [dispatch]);

    const filteredApplications = useMemo(() => {
        const tab = TABS.find(t => t.id === activeTab);
        return [...applications]
            .filter((app: any) => {
                const matchesTab = tab?.statuses.includes(app.status);
                const matchesSearch = !searchQuery || 
                    app.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.application_unique_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.order_unique_id?.toLowerCase().includes(searchQuery.toLowerCase());
                
                return matchesTab && matchesSearch;
            })
            .sort((a: any, b: any) => {
                const rightDate = new Date(b.order_created_at || b.created_at || 0).getTime();
                const leftDate = new Date(a.order_created_at || a.created_at || 0).getTime();

                if (rightDate !== leftDate) {
                    return rightDate - leftDate;
                }

                return Number(b.id || 0) - Number(a.id || 0);
            });
    }, [applications, activeTab, searchQuery]);

    const stats = useMemo(() => {
        return {
            unassigned: applications.filter((a: any) => !a.accountant && TABS[0].statuses.includes(a.status)).length,
            new: applications.filter((a: any) => a.status === 'applied').length,
            total: applications.length
        };
    }, [applications]);

    const handleAssign = async (applicationId: string, accountantId: string) => {
        setAssigningId(applicationId);
        try {
            await dispatch(assignAccountantToApplication({ applicationId, accountantId })).unwrap();
            toast.success("Accountant Assignment updated successfully");
            dispatch(fetchAdminApplications());
        } catch (error: any) {
            toast.error(error || "Failed to update assignment");
        } finally {
            setAssigningId(null);
        }
    };

    return (
        <AuthGuard allowedRoles={["super_admin"]}>
            <AdminLayout>
                <div className="space-y-8 pb-20">
                    {/* Simplified & Friendly Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Service Board</h1>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Track client applications and manage assignments with ease.</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative group min-w-[300px]">
                                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                <input 
                                    type="text" 
                                    placeholder="Search by client or order ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Insight Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200/20 relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Unassigned Requests</p>
                                <p className="text-3xl font-black">{stats.unassigned}</p>
                            </div>
                            <i className="fas fa-user-plus absolute right-6 bottom-4 text-4xl opacity-10 group-hover:scale-110 transition-transform"></i>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">New Arrivals Today</p>
                            <p className="text-3xl font-black text-slate-900">{stats.new}</p>
                            <div className="mt-2 flex items-center gap-1.5 text-emerald-500 font-bold text-[10px]">
                                <i className="fas fa-arrow-trend-up"></i>
                                LIVE TRACKING
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Volume</p>
                            <p className="text-3xl font-black text-slate-900">{stats.total}</p>
                            <p className="mt-2 text-[10px] text-slate-400 font-medium">Lifetime applications processed</p>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                    activeTab === tab.id
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                }`}
                            >
                                <i className={`fas ${tab.icon} text-xs ${activeTab === tab.id ? 'text-blue-500' : 'text-slate-400'}`}></i>
                                {tab.label}
                                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                    {applications.filter((a: any) => tab.statuses.includes(a.status)).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* User-Friendly Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200/60">
                                    <tr>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Client Identity</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Service Track</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Current Status</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Assigned Expert</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Quick Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center">
                                                <LogoLoader size={48} label="Updating Board..." />
                                            </td>
                                        </tr>
                                    ) : filteredApplications.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-32 text-center">
                                                <i className="fas fa-inbox text-4xl text-slate-100 mb-4 block"></i>
                                                <p className="text-sm font-medium text-slate-400">No applications to show right now</p>
                                            </td>
                                        </tr>
                                    ) : filteredApplications.map((app: any) => {
                                        const config = getStatusConfig(app.status);
                                        return (
                                            <tr key={app.id} className="hover:bg-blue-50/20 transition-all group">
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-slate-900/10 transform transition-transform group-hover:scale-105">
                                                            {app.user?.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-900 tracking-tight">{app.user?.name}</div>
                                                            <div className="text-[10px] font-bold text-blue-600/70 font-mono mt-0.5">ORDER #{app.order_unique_id || app.application_unique_id || app.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="text-sm font-bold text-slate-700 mb-1">{app.service?.name}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-black uppercase tracking-widest">{app.service?.category?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border shadow-sm ${config.color}`}>
                                                        <i className={`fas ${config.icon} text-[10px]`}></i>
                                                        {config.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex justify-center">
                                                        {assigningId === app.id ? (
                                                            <div className="h-10 w-36 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                                                <i className="fas fa-spinner animate-spin text-blue-600 text-xs mr-2"></i>
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Assigning...</span>
                                                            </div>
                                                        ) : (
                                                            <SearchableSelect 
                                                                value={app.accountant?.id || ""}
                                                                onChange={(e) => handleAssign(app.id, e.target.value)}
                                                                options={accountants.map((acc: any) => ({
                                                                    value: String(acc.id),
                                                                    label: acc.name,
                                                                }))}
                                                                placeholder="Unassigned"
                                                                size="sm"
                                                                className="min-w-[160px]"
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    <Link 
                                                        href={`/admin/service-applications/${app.id}`}
                                                        className="h-10 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-blue-500/20"
                                                    >
                                                        Details
                                                        <i className="fas fa-arrow-right text-[8px]"></i>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
