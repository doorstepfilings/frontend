"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { format } from "date-fns";
import { PageLogoLoader } from "@/components/ui/logo-loader";

export function AccountantAssignedUserDetailView() {
    const { id } = useParams();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            apiClient.get(`/accountant/users/${id}`)
                .then(res => setUser(res.data?.data))
                .catch(() => toast.error("Failed to load client details"))
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) {
        return (
            <AuthGuard allowedRoles={["accountant"]}>
                <AdminLayout>
                    <PageLogoLoader label="Loading client details..." />
                </AdminLayout>
            </AuthGuard>
        );
    }

    if (!user) {
        return (
            <AuthGuard allowedRoles={["accountant"]}>
                <AdminLayout>
                    <div className="text-center py-20">
                        <h2 className="text-xl font-bold text-slate-900">Client Not Found</h2>
                        <Link href="/accountant/assigned-users" className="mt-4 text-blue-600 font-bold uppercase text-[10px] tracking-widest hover:underline">
                            Return to Directory
                        </Link>
                    </div>
                </AdminLayout>
            </AuthGuard>
        );
    }

    const relationshipManager = user.relationship_manager ?? user.regional_manager;

    return (
        <AuthGuard allowedRoles={["accountant"]}>
            <AdminLayout>
                <div className="max-w-6xl mx-auto space-y-10 pb-24 px-6">
                    {/* Navigation Header */}
                    <div className="flex items-center gap-6 pt-4">
                        <Link 
                            href="/accountant/assigned-users"
                            className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                        >
                            <i className="fas fa-chevron-left text-xs"></i>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Profile</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Management & deep-dive audit</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-10">
                            {/* Primary Profile Card */}
                            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-10">
                                <div className="flex flex-col md:flex-row md:items-center gap-8 mb-10 pb-10 border-b border-slate-100">
                                    <div className="h-24 w-24 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-3xl font-bold shadow-sm">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{user.name}</h2>
                                        <div className="flex flex-wrap items-center gap-4 mt-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Global UID</span>
                                                <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px] font-bold text-slate-700">#{user.id}</span>
                                            </div>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full hidden md:block"></span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[11px] font-bold uppercase tracking-wider border border-emerald-100/50">Active Client</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <section>
                                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <i className="fas fa-address-book text-slate-300"></i> Communication
                                        </h3>
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase mb-1.5">Official Email</p>
                                                <p className="text-base font-bold text-slate-900">{user.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase mb-1.5">Mobile Registry</p>
                                                <p className="text-base font-bold text-slate-900">{user.mobile_number || "Not provided"}</p>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <i className="fas fa-map-marker-alt text-slate-300"></i> Location Profile
                                        </h3>
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase mb-1.5">Primary Residence</p>
                                                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                                    {user.address || "No detailed address recorded"}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-medium text-slate-400 uppercase mb-1">City/State</p>
                                                    <p className="text-sm font-bold text-slate-900">{user.city || "---"}, {user.state || "---"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-medium text-slate-400 uppercase mb-1">Pincode</p>
                                                    <p className="text-sm font-bold text-slate-900">{user.pincode || "---"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>

                            {/* Service Track Record */}
                            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <i className="fas fa-concierge-bell text-slate-300"></i> Active Service Tracks
                                    </h3>
                                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[10px] font-bold">
                                        {user.services?.length || 0} Total
                                    </span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {user.services && user.services.length > 0 ? (
                                        user.services.map((s: any) => (
                                            <div key={s.id} className="px-10 py-6 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                        <i className="fas fa-file-invoice"></i>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{s.service?.name}</p>
                                                        <p className="text-[10px] font-medium text-slate-400 uppercase mt-0.5 tracking-tighter">
                                                            {s.application_unique_id || `REQ-${s.id}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wide">{s.status.replace(/_/g, ' ')}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">Last Update: {format(new Date(s.updated_at), 'dd MMM')}</p>
                                                    </div>
                                                    <Link 
                                                        href={`/accountant/service-requests/${s.id}`}
                                                        className="h-8 px-4 bg-slate-100 text-slate-900 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center"
                                                    >
                                                        Review
                                                    </Link>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-10 py-12 text-center text-slate-400 italic text-sm">
                                            No service tracks recorded for this client.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            {/* Account Support Card */}
                            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-10">
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-8">Account Support</h3>
                                <div className="space-y-10">
                                    {/* Relationship Manager */}
                                    {relationshipManager ? (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shadow-sm">
                                                    {relationshipManager.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-slate-900 leading-none mb-1.5">{relationshipManager.name}</h4>
                                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Relationship Manager</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Direct Line</p>
                                                    <p className="text-sm font-bold text-slate-700">{relationshipManager.mobile_number || "---"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No RM Assigned</p>
                                        </div>
                                    )}

                                    {/* Accountant */}
                                    {user.accountant && (
                                        <div className="space-y-6 pt-6 border-t border-slate-100">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-sm">
                                                    {user.accountant.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-slate-900 leading-none mb-1.5">{user.accountant.name}</h4>
                                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Assigned Accountant</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Service Contact</p>
                                                    <p className="text-sm font-bold text-slate-700">{user.accountant.mobile_number || "---"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Audit & Logs Card */}
                            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-10">
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-8">Account Ledger</h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Onboarding Date</span>
                                        <span className="text-xs font-bold text-slate-700">{user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy') : "---"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Last Log Activity</span>
                                        <span className="text-xs font-bold text-slate-700">{user.updated_at ? format(new Date(user.updated_at), 'dd MMM yyyy') : "---"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Identity Check</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${user.is_mobile_verified ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            {user.is_mobile_verified ? 'Verified' : 'Pending'}
                                        </span>
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
