"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { toast } from "react-hot-toast";
import { rmApi } from "@/lib/api/rm-api";
import { SearchSelect } from "@/components/ui/core/search-select";
import { PanelLogoLoader } from "@/components/ui/logo-loader";

async function fetchAssignedUsersData() {
    const [usersRes, accountantsRes] = await Promise.all([
        rmApi.getAssignedUsers(),
        rmApi.getAccountants(),
    ]);

    return {
        accountants: accountantsRes.data?.data || [],
        users: usersRes.data?.data || [],
    };
}

export function RMAssignedUsersView() {
    const [users, setUsers] = useState<any[]>([]);
    const [accountants, setAccountants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigningUserId, setAssigningUserId] = useState<number | null>(null);

    const refreshData = async () => {
        setLoading(true);
        try {
            const data = await fetchAssignedUsersData();
            setUsers(data.users);
            setAccountants(data.accountants);
        } catch (error) {
            toast.error("Failed to fetch assigned users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const loadAssignedUsers = async () => {
            try {
                const data = await fetchAssignedUsersData();
                if (cancelled) {
                    return;
                }
                setUsers(data.users);
                setAccountants(data.accountants);
            } catch (error) {
                toast.error("Failed to fetch assigned users");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadAssignedUsers();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleAssignAccountant = async (
        userId: number,
        accountantId: string,
    ) => {
        setAssigningUserId(userId);
        try {
            await rmApi.assignAccountant({
                user_id: userId,
                accountant_id: accountantId ? Number(accountantId) : null,
            });
            toast.success("Accountant mapping updated");
            await refreshData();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                    "Failed to assign accountant",
            );
        } finally {
            setAssigningUserId(null);
        }
    };

    return (
        <AuthGuard allowedRoles={["regional_manager"]}>
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
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Consultant Mapping</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-32 text-center">
                                                <PanelLogoLoader
                                                    className="min-h-0 px-0 py-0"
                                                    label="Loading assigned users..."
                                                    size={54}
                                                    surfaceClassName="max-w-md"
                                                />
                                            </td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-32 text-center">
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
                                            <td className="px-8 py-6 text-right">
                                                <SearchSelect
                                                    options={[
                                                        { value: "", label: "Awaiting Mapping" },
                                                        ...accountants.map((accountant: any) => ({
                                                            value: String(accountant.id),
                                                            label: String(accountant.name ?? ""),
                                                        })),
                                                    ]}
                                                    value={String(user.accountant_id || "")}
                                                    onChange={(nextValue) =>
                                                        void handleAssignAccountant(
                                                            user.id,
                                                            nextValue,
                                                        )
                                                    }
                                                    disabled={assigningUserId === user.id}
                                                    searchable={accountants.length > 6}
                                                    triggerClassName="min-h-[2.75rem] min-w-[220px] rounded-xl px-4 py-3"
                                                    valueLabelClassName="text-[10px] font-black uppercase tracking-widest text-slate-600"
                                                    handleClassName="h-6 w-6 rounded-md border-0 bg-transparent text-slate-400"
                                                    selectStyle={{ borderColor: "#e2e8f0", boxShadow: "none" }}
                                                />
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
