"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { apiClient } from "@/lib/api/client";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { PanelLogoLoader } from "@/components/ui/logo-loader";

export function AccountantAssignedUsersView() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get("/accountant/users")
            .then(res => setUsers(res.data?.data || []))
            .catch(() => toast.error("Failed to fetch assigned clients"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AuthGuard allowedRoles={["accountant"]}>
            <AdminLayout>
                <div className="space-y-10 pb-20 px-2">
                    {/* Professional Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Client Directory</h1>
                            <p className="text-sm text-slate-500 mt-1">Management of your assigned client accounts and relationships.</p>
                        </div>
                    </div>

                    {/* Professional Table */}
                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identity & Quick Info</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Communication</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Manager</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-40 text-center">
                                                <PanelLogoLoader
                                                    className="min-h-0 px-0 py-0"
                                                    label="Accessing records..."
                                                    size={54}
                                                    surfaceClassName="max-w-md"
                                                />
                                            </td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-40 text-center">
                                                <p className="text-sm font-medium text-slate-400">No client records currently assigned</p>
                                            </td>
                                        </tr>
                                    ) : users.map((user: any) => (
                                        <tr key={user.id} className="group hover:bg-slate-50/40 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-11 w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 tracking-tight">{user.name}</div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">UID: {user.id}</span>
                                                            <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
                                                            <span className="text-[10px] font-medium text-slate-400 truncate max-w-[150px] italic">{user.city || 'N/A'}, {user.state || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-medium text-slate-700">{user.email}</div>
                                                <div className="text-[11px] text-slate-400 mt-1">{user.mobile_number}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {user.regional_manager ? (
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-700">{user.regional_manager.name}</div>
                                                        <div className="text-[11px] text-slate-400 mt-1">{user.regional_manager.mobile_number}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Link 
                                                    href={`/accountant/assigned-users/${user.id}`}
                                                    className="h-9 px-5 bg-white border border-slate-200 text-slate-900 rounded-lg text-[11px] font-bold uppercase tracking-wide hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm inline-flex items-center justify-center"
                                                >
                                                    Full Detail
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
