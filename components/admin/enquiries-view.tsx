"use client";

import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { apiClient } from "@/lib/api/client";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { buildCollectionKey } from "@/lib/utils/list-keys";

export function EnquiriesView() {
    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchData = async () => {
        try {
            const res = await apiClient.get("/admin/enquiries");
            setEnquiries(res.data?.data || []);
        } catch (error) {
            toast.error("Failed to load intelligence");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadInitialEnquiries = async () => {
            await fetchData();
        };

        void loadInitialEnquiries();
    }, []);

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await apiClient.post(`/admin/enquiries/update-status/${id}`, { status });
            toast.success("Intelligence records updated");
            fetchData();
        } catch (error) {
            toast.error("Update failed");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to eliminate this record?")) return;
        try {
            await apiClient.delete(`/admin/enquiries/${id}`);
            toast.success("Record eliminated from database");
            fetchData();
        } catch (error) {
            toast.error("Destruction failed");
        }
    };

    const filteredEnquiries = useMemo(() => {
        return enquiries.filter(e => {
            const matchesStatus = statusFilter === "all" || e.status === statusFilter;
            const matchesSearch = !searchQuery || 
                e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.message?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [enquiries, statusFilter, searchQuery]);

    const stats = useMemo(() => ({
        total: enquiries.length,
        pending: enquiries.filter(e => e.status === "pending").length,
        responded: enquiries.filter(e => e.status === "responded").length,
        closed: enquiries.filter(e => e.status === "closed").length,
    }), [enquiries]);

    return (
        <AuthGuard allowedRoles={["super_admin"]}>
            <AdminLayout>
                <div className="space-y-10">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Intelligence</h1>
                            <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Communication Monitoring & Market Signals</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative group min-w-[300px]">
                                <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
                                <input 
                                    type="text" 
                                    placeholder="Search inbound signals..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-14 px-6 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
                            >
                                <option value="all">All Channels</option>
                                <option value="pending">Awaiting Action</option>
                                <option value="responded">Feedback Issued</option>
                                <option value="closed">Archive Records</option>
                            </select>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <IntelStat label="Total Logs" value={stats.total} icon="fa-inbox" color="blue" />
                        <IntelStat label="Unresolved" value={stats.pending} icon="fa-clock" color="amber" />
                        <IntelStat label="Responded" value={stats.responded} icon="fa-reply-all" color="indigo" />
                        <IntelStat label="Closed Cases" value={stats.closed} icon="fa-archive" color="emerald" />
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Source / Intel</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payload</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-32 text-center">
                                                <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto"></div>
                                            </td>
                                        </tr>
                                    ) : filteredEnquiries.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-32 text-center">
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No signals detected</p>
                                            </td>
                                        </tr>
                                    ) : filteredEnquiries.map((e: any, index: number) => (
                                        <tr
                                            key={buildCollectionKey(e, index, "admin-enquiry", [
                                                e.email,
                                                e.service,
                                            ])}
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                                                        {e.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 leading-none mb-1">{e.name}</h4>
                                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{e.email}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{format(new Date(e.created_at), 'MMM d, yyyy')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-bold text-slate-600 line-clamp-2 max-w-md">{e.message}</p>
                                                {e.service && <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 block">Ref: {e.service}</span>}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <select 
                                                    value={e.status}
                                                    onChange={(val) => handleUpdateStatus(e.id, val.target.value)}
                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none border transition-all cursor-pointer ${
                                                        e.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        e.status === 'responded' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    }`}
                                                >
                                                    <option value="pending">Awaiting</option>
                                                    <option value="responded">Feedback</option>
                                                    <option value="closed">Archived</option>
                                                </select>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button 
                                                    onClick={() => handleDelete(e.id)}
                                                    className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    <i className="fas fa-trash-alt text-xs"></i>
                                                </button>
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

function IntelStat({ label, value, icon, color }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        amber: "bg-amber-50 text-amber-600",
        indigo: "bg-indigo-50 text-indigo-600",
        emerald: "bg-emerald-50 text-emerald-600",
    };
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-sm shadow-lg ${colors[color]}`}>
                <i className={`fas ${icon}`}></i>
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">{value}</p>
            </div>
        </div>
    );
}
