"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchAdminCategories, fetchAdminServices } from "@/lib/features/admin/admin-slice";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { format } from "date-fns";

type CatalogType = "categories" | "services";

export function CatalogManagementView({ initialType = "categories" }: { initialType?: CatalogType }) {
  const dispatch = useAppDispatch();
  const { categories, services, catalogLoading } = useAppSelector((state) => state.admin);
  const [activeTab, setActiveTab] = useState<CatalogType>(initialType);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    dispatch(fetchAdminCategories());
    dispatch(fetchAdminServices());
  }, [dispatch]);

  const currentData = useMemo(() => {
    const base = activeTab === "categories" ? categories : services;
    
    return base.filter((item: any) => {
        const query = searchQuery.toLowerCase();
        return (
            item.name?.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query) ||
            item.short_description?.toLowerCase().includes(query)
        );
    }).sort((a: any, b: any) => {
        if (sortBy === "name") {
            return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortBy === "price" && activeTab === "services") {
            return sortOrder === "asc" ? (a.price || 0) - (b.price || 0) : (b.price || 0) - (a.price || 0);
        }
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });
  }, [activeTab, categories, services, searchQuery, sortBy, sortOrder]);

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="space-y-10">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight capitalize">{activeTab}</h1>
              <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Global Service Catalog</p>
            </div>
            <div className="flex gap-3">
               <Link 
                  href={`/admin/${activeTab}/create`}
                  className="h-14 px-8 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-3"
               >
                  <i className="fas fa-plus"></i>
                  Create {activeTab === "categories" ? "Category" : "Service"}
               </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <QuickStat 
                label={`Total ${activeTab}`} 
                value={currentData.length} 
                icon={activeTab === "categories" ? "fa-layer-group" : "fa-briefcase"} 
                color="blue"
             />
             <QuickStat 
                label={activeTab === "categories" ? "Total Services" : "Avg Price"} 
                value={activeTab === "categories" ? services.length : `₹${Math.round(services.reduce((acc: number, s: any) => acc + (parseFloat(s.price) || 0), 0) / (services.length || 1))}`} 
                icon={activeTab === "categories" ? "fa-link" : "fa-tag"} 
                color="emerald"
             />
             <QuickStat 
                label="Latest Update" 
                value={currentData[0]?.created_at ? format(new Date(currentData[0].created_at), 'MMM d') : 'N/A'} 
                icon="fa-clock" 
                color="amber"
             />
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
            {[
              { id: "categories", label: "Categories", icon: "fa-layer-group" },
              { id: "services", label: "Services", icon: "fa-briefcase" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CatalogType)}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <i className={`fas ${tab.icon} text-xs`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Catalog Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
             {/* Toolbar */}
             <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                   <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors text-xs"></i>
                   <input 
                      type="text" 
                      placeholder={`Search ${activeTab}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                   />
                </div>
                <div className="flex gap-3">
                   <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                   >
                      <option value="created_at">Date Created</option>
                      <option value="name">Alpha Name</option>
                      {activeTab === "services" && <option value="price">Price Point</option>}
                   </select>
                   <button 
                      onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                      className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all shadow-sm"
                   >
                      <i className={`fas fa-sort-amount-${sortOrder === "asc" ? "down" : "up"}`}></i>
                   </button>
                </div>
             </div>

             {/* Grid/List View */}
             <div className="p-8">
                {catalogLoading ? (
                    <div className="py-32 text-center flex flex-col items-center gap-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Catalog Data...</p>
                    </div>
                ) : currentData.length === 0 ? (
                    <div className="py-32 text-center max-w-xs mx-auto opacity-40">
                        <i className="fas fa-box-open text-5xl text-slate-200 mb-6"></i>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic">Catalog Empty</p>
                    </div>
                ) : activeTab === "categories" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {currentData.map((category: any) => (
                            <CategoryCard key={category.id} category={category} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {currentData.map((service: any) => (
                            <ServiceCard key={service.id} service={service} />
                        ))}
                    </div>
                )}
             </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

function CategoryCard({ category }: { category: any }) {
    return (
        <div className="group bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="h-14 w-14 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <i className={`fas ${category.icon || 'fa-folder-open'}`}></i>
                </div>
                <div className="text-right">
                    <span className="block text-xl font-bold text-slate-900 tracking-tight">{category.services_count || 0}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Services</span>
                </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors">{category.name}</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 mb-6">{category.description || 'No description available.'}</p>
            
            <div className="space-y-2 mb-6 border-t border-slate-50 pt-4">
                <div className="flex justify-between items-center text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    <span>Created</span>
                    <span className="text-slate-600">{category.created_at ? format(new Date(category.created_at), 'MMM d, yyyy HH:mm') : '—'}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    <span>Modified</span>
                    <span className="text-slate-600">{category.updated_at ? format(new Date(category.updated_at), 'MMM d, yyyy HH:mm') : '—'}</span>
                </div>
            </div>

            <div className="flex gap-2">
                <Link href={`/admin/categories/edit/${category.id}`} className="flex-1 h-10 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2">
                    <i className="fas fa-edit text-[9px]"></i>
                    Modify
                </Link>
                <button className="h-10 w-10 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center">
                    <i className="fas fa-trash-alt text-xs"></i>
                </button>
            </div>
        </div>
    );
}
function ServiceCard({ service }: { service: any }) {
    return (
        <div className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
            <div className="p-6 flex flex-col md:flex-row items-start gap-6">
                <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                    <i className={`fas ${service.category?.icon || 'fa-briefcase'}`}></i>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                            {service.category?.name || 'General'}
                        </span>
                        <div className="text-right">
                            <span className="block text-xl font-bold text-slate-900 tracking-tight">₹{Math.round(service.price).toLocaleString('en-IN')}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Starting Price</span>
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors">{service.name}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 mb-4">{service.short_description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <ServiceMeta icon="fa-tags" value={service.pricing_plans?.length || 0} label="Plans" />
                        <ServiceMeta icon="fa-file-alt" value={service.required_documents_list?.length || 0} label="Docs" />
                        <ServiceMeta icon="fa-question-circle" value={service.faqs?.length || 0} label="FAQs" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-slate-50">
                        <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created</span>
                            <span className="text-[10px] font-semibold text-slate-600">{service.created_at ? format(new Date(service.created_at), 'MMM d, yyyy HH:mm') : '—'}</span>
                        </div>
                        <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Modified</span>
                            <span className="text-[10px] font-semibold text-slate-600">{service.updated_at ? format(new Date(service.updated_at), 'MMM d, yyyy HH:mm') : '—'}</span>
                        </div>
                    </div>
 
                    <div className="flex gap-2">
                        <Link href={`/admin/services/edit/${service.id}`} className="flex-1 h-10 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                            <i className="fas fa-edit text-[9px]"></i>
                            Edit Details
                        </Link>
                        <button className="h-10 w-10 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center">
                            <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ServiceMeta({ icon, value, label }: any) {
    return (
        <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center text-[10px]">
                <i className={`fas ${icon}`}></i>
            </div>
            <div>
                <span className="block text-xs font-black text-slate-900 leading-none">{value}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
            </div>
        </div>
    );
}

function QuickStat({ label, value, icon, color }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
            <div className={`h-12 w-12 rounded-xl ${colors[color]} flex items-center justify-center text-lg shadow-sm`}>
                <i className={`fas ${icon}`}></i>
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">{value}</p>
            </div>
        </div>
    );
}
