"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { toast } from "react-hot-toast";
import { rmApi } from "@/lib/api/rm-api";
import { LogoLoader } from "@/components/ui/logo-loader";

export function RMAssignedUsersView() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const usersRes = await rmApi.getAssignedUsers();
            setUsers(usersRes.data?.data || []);
        } catch (error) {
            toast.error("Failed to fetch assigned users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchData();
    }, []);

    return (
        <AuthGuard allowedRoles={["relationship_manager"]}>
            <AdminLayout>
                <div className="space-y-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Assigned Users</h1>
                            <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Clients under your supervision</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Name</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-32 text-center">
                                                <LogoLoader size={48} label="Loading Users..." />
                                            </td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-32 text-center">
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No assigned users found</p>
                                            </td>
                                        </tr>
                                    ) : users.map((user: any) => (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-xs font-bold text-slate-600">{user.email}</div>
                                                <div className="text-[10px] text-slate-400 mt-1">{user.mobile_number}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-bold text-slate-400">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
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
