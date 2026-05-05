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

const STATUS_COLOR: any = {
    draft: 'bg-slate-100 text-slate-700',
    pending: 'bg-amber-100 text-amber-800',
    update_required: 'bg-rose-500 text-white',
    approved: 'bg-emerald-500 text-white',
    rejected: 'bg-rose-100 text-rose-800',
    cancelled: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-600 text-white',
    paid: 'bg-emerald-500 text-white',
    completed: 'bg-emerald-500 text-white',
    applied: 'bg-indigo-500 text-white',
    submitted_to_ca: 'bg-blue-100 text-blue-800',
    under_review: 'bg-purple-100 text-purple-800',
    document_collection: 'bg-amber-100 text-amber-800',
};

const STATUS_LABEL: any = {
    draft: 'Draft',
    pending: 'Awaiting Review',
    update_required: 'Action Required',
    approved: 'Completed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    in_progress: 'Processing',
    paid: 'Payment Verified',
    completed: 'Service Completed',
    applied: 'New Order',
    submitted_to_ca: 'Forwarded to CA',
    under_review: 'Verification',
    document_collection: 'Doc Collection',
};

const TABS = [
    { id: 'active', label: 'Active Board', icon: 'fa-chart-line', statuses: ['draft', 'pending', 'update_required', 'in_progress', 'paid', 'submitted_to_ca', 'under_review', 'document_collection', 'applied'] },
    { id: 'completed', label: 'Closed Services', icon: 'fa-check-double', statuses: ['approved', 'completed'] },
    { id: 'cancelled', label: 'Refunds/Cancelled', icon: 'fa-ban', statuses: ['rejected', 'cancelled', 'refunded', 'failed'] },
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
        return applications.filter((app: any) => {
            const matchesTab = tab?.statuses.includes(app.status);
            const matchesSearch = !searchQuery || 
                app.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.application_unique_id?.toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesTab && matchesSearch;
        });
    }, [applications, activeTab, searchQuery]);

    const handleAssign = async (applicationId: string, accountantId: string) => {
        setAssigningId(applicationId);
        try {
            await dispatch(assignAccountantToApplication({ applicationId, accountantId })).unwrap();
            toast.success("Accountant assigned successfully");
            dispatch(fetchAdminApplications());
        } catch (error: any) {
            toast.error(error || "Assignment failed");
        } finally {
            setAssigningId(null);
        }
    };

    return (
        <AuthGuard allowedRoles={["super_admin"]}>
            <AdminLayout>
                <div className="space-y-10">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Service Board</h1>
                            <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Manage Filings & Assignments</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="relative group min-w-[300px]">
                                <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
                                <input 
                                    type="text" 
                                    placeholder="Search applications..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-4 p-2 bg-slate-100 rounded-[2rem] w-fit">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab.id
                                        ? "bg-white text-blue-600 shadow-lg shadow-slate-200"
                                        : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                <i className={`fas ${tab.icon} text-sm`}></i>
                                {tab.label}
                                <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[9px] ${activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                    {applications.filter((a: any) => tab.statuses.includes(a.status)).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Applications Table */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client / Order ID</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Details</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Process Status</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Assignee</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Board...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredApplications.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-32 text-center">
                                                <i className="fas fa-folder-open text-5xl text-slate-100 mb-6 block"></i>
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching applications</p>
                                            </td>
                                        </tr>
                                    ) : filteredApplications.map((app: any, index: number) => (
                                        <tr
                                            key={buildCollectionKey(app, index, "admin-application", [
                                                app.user?.email,
                                                app.service?.name,
                                            ])}
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-slate-900/10">
                                                        {app.user?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 leading-none mb-1">{app.user?.name}</h4>
                                                        <p className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-tighter">#{app.application_unique_id || app.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <h4 className="text-sm font-black text-slate-800 mb-1">{app.service?.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">{app.service?.category?.name}</span>
                                                    <span className="text-slate-300 text-[10px]">•</span>
                                                                                                        <span className="text-[10px] font-bold text-slate-400">
                                                        {(() => {
                                                            if (!app.created_at) return '—';
                                                            const d = new Date(app.created_at);
                                                            return isNaN(d.getTime()) ? '—' : format(d, 'MMM d, yyyy');
                                                        })()}
                                                    </span>

                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-transparent shadow-sm ${STATUS_COLOR[app.status] || 'bg-slate-100 text-slate-600'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${['approved', 'completed', 'paid'].includes(app.status) ? 'bg-white' : 'bg-current animate-pulse'}`}></span>
                                                    {STATUS_LABEL[app.status] || app.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center">
                                                    {assigningId === app.id ? (
                                                        <div className="h-10 w-32 bg-slate-50 rounded-xl flex items-center justify-center">
                                                            <i className="fas fa-circle-notch animate-spin text-blue-600 text-xs"></i>
                                                        </div>
                                                    ) : (
                                                        <select 
                                                            value={app.accountant?.id || ""}
                                                            onChange={(e) => handleAssign(app.id, e.target.value)}
                                                            className={`h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none transition-all cursor-pointer border ${app.accountant ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}
                                                        >
                                                            <option value="">— Unassigned —</option>
                                                            {accountants.map((acc: any) => (
                                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Link 
                                                    href={`/admin/service-applications/${app.id}`}
                                                    className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
                                                >
                                                    Manage
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
