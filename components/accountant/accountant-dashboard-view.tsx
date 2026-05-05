"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchAccountantDashboard } from "@/lib/features/accountant/accountant-slice";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { buildCollectionKey } from "@/lib/utils/list-keys";
import { useStoredUser } from "@/lib/auth/hooks";

export function AccountantDashboardView() {
    const dispatch = useAppDispatch();
    const { stats, serviceRequests, loading } = useAppSelector((state) => state.accountant);
    const user = useStoredUser();

    useEffect(() => {
        dispatch(fetchAccountantDashboard());
    }, [dispatch]);

    return (
        <AuthGuard allowedRoles={["accountant"]}>
            <AdminLayout>
                <div className="space-y-10">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Accountant Workspace</h1>
                            <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Operations Desk • {user?.name}</p>
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        <StatCard label="New Assigned" value={stats.newAssignments} icon="fa-user-tag" color="blue" />
                        <StatCard label="In Processing" value={stats.ongoing} icon="fa-spinner" color="amber" />
                        <StatCard label="Under Review" value={stats.underReview} icon="fa-search" color="indigo" />
                        <StatCard label="Completed" value={stats.completed} icon="fa-check-circle" color="emerald" />
                        <StatCard label="Total Clients" value={stats.totalClients} icon="fa-users" color="slate" />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                        {/* Assignment Queue */}
                        <div className="xl:col-span-2 space-y-6">
                            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Active Work Queue</h3>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{serviceRequests.length} Tasks</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/50">
                                            <tr>
                                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service / Client</th>
                                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={3} className="px-8 py-24 text-center">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Assignments...</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : serviceRequests.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-8 py-24 text-center">
                                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No assigned tasks</p>
                                                    </td>
                                                </tr>
                                            ) : serviceRequests.slice(0, 5).map((req: any, index: number) => (
                                                <tr
                                                    key={buildCollectionKey(req, index, "accountant-dashboard-request", [
                                                        req.user?.email,
                                                        req.service?.name,
                                                    ])}
                                                    className="hover:bg-slate-50/50 transition-colors"
                                                >
                                                    <td className="px-8 py-6">
                                                        <h4 className="text-sm font-black text-slate-900 mb-1">{req.service?.name}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{req.user?.name}</p>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <StatusIndicator status={req.status} />
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <Link 
                                                            href={`/accountant/service-requests/${req.id}`}
                                                            className="h-10 px-4 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all inline-flex items-center"
                                                        >
                                                            PROCESS TASK
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Status Summary */}
                        <div className="space-y-6">
                            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-900/20">
                                <h3 className="text-xl font-black tracking-tight mb-8">Performance</h3>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3 text-slate-400">
                                            <span>Resolution Rate</span>
                                            <span>{Math.round((stats.completed / Math.max(stats.totalRequests, 1)) * 100)}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${(stats.completed / Math.max(stats.totalRequests, 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total</p>
                                            <p className="text-2xl font-black">{stats.totalRequests}</p>
                                        </div>
                                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Urgent</p>
                                            <p className="text-2xl font-black text-rose-400">{stats.actionRequired}</p>
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
