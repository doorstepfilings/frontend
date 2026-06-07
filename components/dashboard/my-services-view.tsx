"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchMyServices } from "@/lib/features/services/services-slice";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { SearchableSelect } from "@/components/ui/searchable-select";
import Link from "next/link";
import { format } from "date-fns";
import { LogoLoader } from "@/components/ui/logo-loader";

export function MyServicesView() {
    const dispatch = useAppDispatch();
    const { myServices, loading } = useAppSelector((state) => state.services);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        dispatch(fetchMyServices());
    }, [dispatch]);

    const filteredServices = useMemo(() => {
        return (myServices || []).filter(s => {
            const matchesSearch = !searchQuery || s.service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || (s.application_unique_id || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || s.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [myServices, searchQuery, statusFilter]);

    return (
        <div className="space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Services</h1>
                    <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Track your ongoing filings and compliance history</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    <input 
                        type="text" 
                        placeholder="Search service or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                </div>
                <SearchableSelect 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: "all", label: "All Stages" },
                      { value: "applied", label: "New Applications" },
                      { value: "in_progress", label: "In Progress" },
                      { value: "under_review", label: "Under Review" },
                      { value: "completed", label: "Completed" }
                    ]}
                    placeholder="All Stages"
                    size="sm"
                    className="min-w-[200px]"
                />
            </div>

            {/* List */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Name</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applied Date</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-32 text-center">
                                        <LogoLoader size={56} label="Loading services..." />
                                    </td>
                                </tr>
                            ) : filteredServices.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <i className="fas fa-clipboard-list text-3xl text-slate-100"></i>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching services found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredServices.map((s: any) => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                                                <i className="fas fa-file-contract"></i>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 leading-none mb-1.5">{s.service?.name}</h4>
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">#{s.application_unique_id || s.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <StatusIndicator status={s.status} />
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className="text-[11px] font-bold text-slate-500">{format(new Date(s.created_at), 'MMMM d, yyyy')}</span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <Link 
                                            href={`/dashboard/services/${s.id}`}
                                            className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all inline-flex items-center"
                                        >
                                            View Progress
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
