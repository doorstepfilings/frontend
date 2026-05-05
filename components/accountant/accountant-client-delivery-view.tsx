"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchAccountantDashboard } from "@/lib/features/accountant/accountant-slice";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AccountantUploadForm } from "./accountant-upload-form";

export function AccountantClientDeliveryView() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { assignedUsers, serviceRequests, loading } = useAppSelector((state) => state.accountant);

    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedRequestId, setSelectedRequestId] = useState<string>("");

    useEffect(() => {
        dispatch(fetchAccountantDashboard());
    }, [dispatch]);

    const activeRequests = useMemo(() => {
        return serviceRequests.filter(
            (req: any) => String(req.user?.id) === selectedUserId &&
                !["refunded", "cancelled"].includes(req.status)
        );
    }, [serviceRequests, selectedUserId]);

    const handleSuccess = () => {
        router.push("/accountant/documents");
    };

    return (
        <AuthGuard allowedRoles={["accountant"]}>
            <AdminLayout>
                <div className="max-w-5xl mx-auto space-y-10 pb-20">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Client Delivery Hub</h1>
                            <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Upload and commit certificates or reports for client fulfillment</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-10 lg:p-14 space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                                    Target Client
                                </label>
                                <div className="relative group">
                                    <select
                                        value={selectedUserId}
                                        onChange={(e) => {
                                            setSelectedUserId(e.target.value);
                                            setSelectedRequestId("");
                                        }}
                                        className="w-full h-16 px-8 bg-slate-50 border-none rounded-3xl text-sm font-bold text-slate-900 hover:bg-slate-100 focus:ring-8 focus:ring-blue-500/10 outline-none appearance-none transition-all cursor-pointer"
                                    >
                                        <option value="">Choose a Client Profile...</option>
                                        {assignedUsers.map((u: any) => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                        ))}
                                    </select>
                                    <i className="fas fa-chevron-down absolute right-8 top-1/2 -translate-y-1/2 text-xs text-slate-300 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                                    Operational Order
                                </label>
                                <div className="relative group">
                                    <select
                                        value={selectedRequestId}
                                        disabled={!selectedUserId || loading}
                                        onChange={(e) => setSelectedRequestId(e.target.value)}
                                        className="w-full h-16 px-8 bg-slate-50 border-none rounded-3xl text-sm font-bold text-slate-900 hover:bg-slate-100 focus:ring-8 focus:ring-blue-500/10 outline-none appearance-none transition-all cursor-pointer disabled:opacity-40"
                                    >
                                        <option value="">
                                            {loading ? "Syncing orders..." :
                                                !selectedUserId ? "Select a client first" :
                                                    activeRequests.length === 0 ? "No active orders found" :
                                                        "Choose a Service Order..."}
                                        </option>
                                        {activeRequests.map((r: any) => (
                                            <option key={r.id} value={r.id}>
                                                {r.service?.name} (ID: #{r.application_unique_id || r.id})
                                            </option>
                                        ))}
                                    </select>
                                    <i className="fas fa-chevron-down absolute right-8 top-1/2 -translate-y-1/2 text-xs text-slate-300 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {selectedRequestId && (
                            <div className="animate-in fade-in slide-in-from-top-6 duration-500">
                                <div className="p-1 h-px bg-slate-50 mb-12"></div>
                                <AccountantUploadForm 
                                    requestId={selectedRequestId}
                                    onSuccess={handleSuccess}
                                    showFinalToggle={true}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
