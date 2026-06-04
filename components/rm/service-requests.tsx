"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { toast } from "react-hot-toast";
import { rmApi } from "@/lib/api/rm-api";
import { getStatusColor, getStatusLabel } from "@/lib/status-helpers";
import { buildCollectionKey } from "@/lib/utils/list-keys";
import { PanelLogoLoader } from "@/components/ui/logo-loader";

export function RMServiceRequests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadRequests = async () => {
        try {
            const response = await rmApi.getServiceRequests();
            setRequests(response.data?.data || []);
        } catch (error) {
            toast.error("Failed to fetch service requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadRequests();
    }, []);

    return (
        <AuthGuard allowedRoles={["regional_manager"]}>
            <AdminLayout>
                <div className="space-y-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Service Pipeline</h1>
                            <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Track applications for your users</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client / User</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Requested</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Consultant</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-32 text-center">
                                                <PanelLogoLoader
                                                    className="min-h-0 px-0 py-0"
                                                    label="Loading service requests..."
                                                    size={54}
                                                    surfaceClassName="max-w-md"
                                                />
                                            </td>
                                        </tr>
                                    ) : requests.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-32 text-center">
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No service requests found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        requests.map((request: any, index: number) => (
                                            <tr key={buildCollectionKey(request, index, "rm-request", [request.user?.email, request.service?.name])} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                                                            {request.user?.name?.charAt(0).toUpperCase() || "U"}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-slate-900">{request.user?.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold mt-1">{request.user?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-sm font-bold text-slate-700">{request.service?.name}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {request.accountant ? (
                                                        <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                            <i className="fas fa-user-tie text-slate-400"></i>
                                                            {request.accountant.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-medium italic">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${getStatusColor(request.status)}`}>
                                                        {getStatusLabel(request.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
