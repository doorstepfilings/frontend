"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchAdminCategories, fetchAdminServices, deleteDocument } from "@/lib/features/admin/admin-slice";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { apiClient } from "@/lib/api/client";

export function ServiceManagementView() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { services, categories, catalogLoading: loading } = useAppSelector((state) => state.admin);
    const { confirm, ConfirmDialog } = useConfirm();

    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    useEffect(() => {
        dispatch(fetchAdminCategories());
        dispatch(fetchAdminServices());
    }, [dispatch]);

    const handleDelete = async (id: string | number, name: string) => {
        const ok = await confirm({
            title: "Delete Service",
            message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
            confirmLabel: "Delete",
            variant: "danger",
        });
        
        if (!ok) return;

        try {
            await apiClient.delete(`/admin/services/${id}`);
            toast.success("Service deleted successfully");
            dispatch(fetchAdminServices());
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete service");
        }
    };

    const filteredAndSorted = useMemo(() => {
        let result = services.filter((s: any) => {
            const matchesSearch = 
                s.name?.toLowerCase().includes(search.toLowerCase()) ||
                s.short_description?.toLowerCase().includes(search.toLowerCase());
            const matchesCat = filterCategory ? String(s.service_category_id) === String(filterCategory) : true;
            return matchesSearch && matchesCat;
        });

        return result.sort((a: any, b: any) => {
            if (sortBy === "name") {
                return sortOrder === "asc" 
                    ? a.name.localeCompare(b.name) 
                    : b.name.localeCompare(a.name);
            } else if (sortBy === "price") {
                const priceA = Number(a.price || 0);
                const priceB = Number(b.price || 0);
                return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
            } else {
                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();
                return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
            }
        });
    }, [services, search, filterCategory, sortBy, sortOrder]);

    const stats = useMemo(() => {
        const totalValue = services.reduce((sum: number, s: any) => sum + Number(s.price || 0), 0);
        const avgPrice = services.length > 0 ? totalValue / services.length : 0;
        return {
            total: services.length,
            categories: categories.length,
            avgPrice: Math.round(avgPrice),
        };
    }, [services, categories]);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="flex flex-col items-center gap-6">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-xl"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Synchronizing Catalog...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AuthGuard allowedRoles={["super_admin"]}>
            <AdminLayout>
                <div className="max-w-7xl mx-auto space-y-10 pb-24">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Service Catalog</h1>
                            <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">
                                {stats.total} Active Services • {stats.categories} Verticals
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/50">
                                <button 
                                    onClick={() => setViewMode("grid")}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                >
                                    <i className="fas fa-th-large"></i>
                                </button>
                                <button 
                                    onClick={() => setViewMode("list")}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                >
                                    <i className="fas fa-list"></i>
                                </button>
                            </div>
                            <Link 
                                href="/admin/services/create"
                                className="h-14 px-8 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95"
                            >
                                <i className="fas fa-plus-circle"></i>
                                Add New Service
                            </Link>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <StatCard 
                            label="Catalog Volume" 
                            value={stats.total} 
                            icon="fa-briefcase" 
                            gradient="from-blue-500 to-indigo-600"
                            bg="bg-blue-50"
                        />
                        <StatCard 
                            label="Service Verticals" 
                            value={stats.categories} 
                            icon="fa-layer-group" 
                            gradient="from-emerald-500 to-teal-600"
                            bg="bg-emerald-50"
                        />
                        <StatCard 
                            label="Mean Price Point" 
                            value={`₹${stats.avgPrice.toLocaleString('en-IN')}`} 
                            icon="fa-tag" 
                            gradient="from-amber-500 to-orange-600"
                            bg="bg-amber-50"
                        />
                    </div>

                    {/* Filter & Toolbar */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden p-8">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 relative group">
                                <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"></i>
                                <input 
                                    type="text" 
                                    placeholder="Search by name or description..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <div className="relative min-w-[200px]">
                                    <i className="fas fa-filter absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                                    <select 
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none transition-all"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((cat: any) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 pointer-events-none"></i>
                                </div>
                                <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
                                    <select 
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="bg-transparent border-none py-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-0 outline-none"
                                    >
                                        <option value="created_at">Sort: Recent</option>
                                        <option value="name">Sort: Alpha</option>
                                        <option value="price">Sort: Price</option>
                                    </select>
                                    <button 
                                        onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                                        className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm transition-all"
                                    >
                                        <i className={`fas fa-sort-amount-${sortOrder === "asc" ? "down" : "up"}`}></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Display */}
                    {filteredAndSorted.length === 0 ? (
                        <div className="bg-white rounded-[4rem] border border-slate-100 p-24 text-center shadow-sm">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
                                <i className="fas fa-search text-3xl text-slate-200"></i>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">No matches found</h3>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest opacity-60">Adjust your search or filter parameters</p>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {filteredAndSorted.map((service: any) => (
                                <ServiceCard 
                                    key={service.id} 
                                    service={service} 
                                    onDelete={() => handleDelete(service.id, service.name)} 
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Profile</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vertical</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price Point</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Architecture</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredAndSorted.map((service: any) => (
                                            <tr key={service.id} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                            <i className={`fas ${service.category?.icon || 'fa-briefcase'}`}></i>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{service.name}</h4>
                                                            <p className="text-[10px] font-bold text-slate-400 line-clamp-1 max-w-[240px] uppercase tracking-wider">{service.short_description || 'Global Service Solution'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                                                        {service.category?.name || 'General'}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-slate-900 tracking-tight">₹{Math.round(service.price).toLocaleString('en-IN')}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Base Rate</p>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex gap-4">
                                                        <MetaIcon value={service.pricing_plans?.length || 0} icon="fa-tags" color="text-indigo-400" />
                                                        <MetaIcon value={service.required_documents_list?.length || 0} icon="fa-file-alt" color="text-emerald-400" />
                                                        <MetaIcon value={service.faqs?.length || 0} icon="fa-question-circle" color="text-amber-400" />
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => router.push(`/admin/services/edit/${service.id}`)}
                                                            className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-sm"
                                                        >
                                                            Modify
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(service.id, service.name)}
                                                            className="h-10 w-10 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center border border-rose-100"
                                                        >
                                                            <i className="fas fa-trash-alt text-[11px]"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                <ConfirmDialog />
            </AdminLayout>
        </AuthGuard>
    );
}

function ServiceCard({ service, onDelete }: { service: any, onDelete: () => void }) {
    const router = useRouter();
    return (
        <div className="group bg-white border border-slate-100 rounded-[3rem] overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col h-full">
            <div className="p-8 flex-1">
                <div className="flex items-start justify-between mb-8">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-blue-50 text-blue-600 flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm border border-blue-100/50">
                        <i className={`fas ${service.category?.icon || 'fa-briefcase'}`}></i>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Starting At</span>
                        <span className="text-2xl font-black text-slate-900 tracking-tight">₹{Math.round(service.price).toLocaleString('en-IN')}</span>
                    </div>
                </div>
                
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-widest mb-3 inline-block">
                    {service.category?.name || 'General'}
                </span>
                
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[56px] leading-tight">
                    {service.name}
                </h3>
                
                <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-3 mb-8 opacity-70">
                    {service.short_description || 'Premium service offering designed for efficiency and compliance excellence.'}
                </p>

                <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
                    <DetailedMeta icon="fa-tags" value={service.pricing_plans?.length || 0} label="Plans" color="blue" />
                    <DetailedMeta icon="fa-file-alt" value={service.required_documents_list?.length || 0} label="Docs" color="emerald" />
                    <DetailedMeta icon="fa-question-circle" value={service.faqs?.length || 0} label="FAQs" color="amber" />
                </div>
            </div>
            
            <div className="p-8 pt-0 flex gap-3">
                <button 
                    onClick={() => router.push(`/admin/services/edit/${service.id}`)}
                    className="flex-1 h-14 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                    <i className="fas fa-pencil-alt"></i>
                    Modify Service
                </button>
                <button 
                    onClick={onDelete}
                    className="h-14 w-14 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center border border-rose-100 active:scale-95 shadow-sm"
                >
                    <i className="fas fa-trash-alt text-lg"></i>
                </button>
            </div>
        </div>
    );
}

function DetailedMeta({ icon, value, label, color }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
    };
    return (
        <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg ${colors[color]} flex items-center justify-center text-[10px] shadow-inner`}>
                <i className={`fas ${icon}`}></i>
            </div>
            <div>
                <span className="block text-xs font-black text-slate-900 leading-none mb-0.5">{value}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
            </div>
        </div>
    );
}

function MetaIcon({ value, icon, color }: any) {
    return (
        <div className="flex items-center gap-2">
            <i className={`fas ${icon} ${color} text-xs`}></i>
            <span className="text-xs font-black text-slate-700">{value}</span>
        </div>
    );
}

function StatCard({ label, value, icon, gradient, bg }: any) {
    return (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex items-center gap-6 shadow-sm group hover:border-blue-100 transition-all duration-500">
            <div className={`h-16 w-16 rounded-[1.5rem] ${bg} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500`}>
                <i className={`fas ${icon} bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}></i>
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
            </div>
        </div>
    );
}
