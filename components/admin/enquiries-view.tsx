"use client";

import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { apiClient } from "@/lib/api/client";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { buildCollectionKey } from "@/lib/utils/list-keys";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { LogoLoader } from "@/components/ui/logo-loader";
import { Modal } from "@/components/ui/modal";

export function EnquiriesView() {
    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null);

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
                e.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                            <SearchableSelect 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                options={[
                                    { value: "all", label: "All Channels" },
                                    { value: "pending", label: "Awaiting Action" },
                                    { value: "responded", label: "Feedback Issued" },
                                    { value: "closed", label: "Archive Records" }
                                ]}
                                placeholder="All Channels"
                                size="sm"
                                className="min-w-[200px]"
                            />
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
                                            <td colSpan={4} className="px-8 py-24 text-center">
                                                <LogoLoader size={48} label="Loading enquiries..." />
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
                                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">{e.email}</p>
                                                        {e.phone && (
                                                            <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mb-1">
                                                                <i className="fas fa-phone-alt text-[8px] text-slate-400"></i>
                                                                {e.phone}
                                                            </p>
                                                        )}
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(e.created_at), 'MMM d, yyyy')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td
                                                className="px-8 py-6 cursor-pointer"
                                                onClick={() => setSelectedEnquiry(e)}
                                            >
                                                <p className="text-xs font-bold text-slate-600 line-clamp-2 max-w-md">{e.message}</p>
                                                {e.service && <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 block">Ref: {e.service}</span>}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <SearchableSelect 
                                                    value={e.status}
                                                    onChange={(val) => handleUpdateStatus(e.id, val.target.value)}
                                                    options={[
                                                        { value: "pending", label: "Awaiting" },
                                                        { value: "responded", label: "Feedback" },
                                                        { value: "closed", label: "Archived" }
                                                    ]}
                                                    placeholder="Status"
                                                    size="sm"
                                                    className="min-w-[120px]"
                                                />
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedEnquiry(e)}
                                                        className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                                                        title="View Details"
                                                    >
                                                        <i className="fas fa-eye text-xs"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(e.id)}
                                                        className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                                                        title="Delete Enquiry"
                                                    >
                                                        <i className="fas fa-trash-alt text-xs"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {selectedEnquiry && (
                        <Modal
                            isOpen={!!selectedEnquiry}
                            onClose={() => setSelectedEnquiry(null)}
                            title="Enquiry Details"
                            size="lg"
                        >
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Client Name</label>
                                        <p className="text-sm font-bold text-slate-900">{selectedEnquiry.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email Address</label>
                                        <a href={`mailto:${selectedEnquiry.email}`} className="text-sm font-bold text-blue-600 hover:underline">{selectedEnquiry.email}</a>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Phone Number</label>
                                        {selectedEnquiry.phone ? (
                                            <a href={`tel:${selectedEnquiry.phone}`} className="text-sm font-bold text-slate-700 hover:underline">{selectedEnquiry.phone}</a>
                                        ) : (
                                            <p className="text-sm font-bold text-slate-400">Not provided</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Service Reference</label>
                                        <p className="text-sm font-bold text-slate-700">{selectedEnquiry.service || "General Inquiry"}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Received Date</label>
                                        <p className="text-sm font-bold text-slate-700">{format(new Date(selectedEnquiry.created_at), 'PPP pp')}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                                        <div className="mt-1 w-40">
                                            <SearchableSelect
                                                value={selectedEnquiry.status}
                                                onChange={(val) => {
                                                    handleUpdateStatus(selectedEnquiry.id, val.target.value);
                                                    setSelectedEnquiry((prev: any | null) => prev ? { ...prev, status: val.target.value } : null);
                                                }}
                                                options={[
                                                    { value: "pending", label: "Awaiting Action" },
                                                    { value: "responded", label: "Feedback Issued" },
                                                    { value: "closed", label: "Archive Record" }
                                                ]}
                                                placeholder="Status"
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Message Payload</label>
                                    <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl text-sm font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                                        {selectedEnquiry.message}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => {
                                            handleDelete(selectedEnquiry.id);
                                            setSelectedEnquiry(null);
                                        }}
                                        className="px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Delete Record
                                    </button>
                                    <button
                                        onClick={() => setSelectedEnquiry(null)}
                                        className="px-5 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </Modal>
                    )}
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
