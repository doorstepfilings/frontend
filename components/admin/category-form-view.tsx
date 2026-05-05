"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { IconPicker } from "./icon-picker";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";

export function CategoryFormView() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const isEditMode = Boolean(id);
    
    const [form, setForm] = useState({
        name: "",
        icon: "fa-briefcase",
        description: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // The backend doesn't have a single category GET endpoint.
                // We fetch all and find the match, same as the legacy Laravel project.
                const response = await apiClient.get("/admin/categories");
                const items = response.data?.data || response.data || [];
                
                if (isEditMode) {
                    const matchedCategory = items.find((item: any) => String(item.id) === String(id));
                    if (!matchedCategory) {
                        toast.error("Category record not found in catalog");
                        router.push("/admin/categories");
                        return;
                    }

                    setForm({
                        name: matchedCategory.name || "",
                        icon: matchedCategory.icon || "fa-briefcase",
                        description: matchedCategory.description || "",
                    });
                }
            } catch (error: any) {
                console.error("Category Fetch Error:", error);
                toast.error("Unable to load category configuration");
                router.push("/admin/categories");
            } finally {
                setLoading(false);
            }
        };
        
        fetchInitialData();
    }, [id, isEditMode, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!form.name.trim()) return toast.error("Category identity is required");
        if (!form.description.trim()) return toast.error("A strategic description is required");

        setSaving(true);
        try {
            const endpoint = isEditMode 
                ? `/admin/categories/update/${id}` 
                : "/admin/categories/store";
            
            await apiClient.post(endpoint, form);
            toast.success(`Taxonomy ${isEditMode ? 'synchronized' : 'published'} successfully`);
            router.push("/admin/categories");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to finalize category");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="flex flex-col items-center gap-6">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-xl"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Accessing Taxonomy...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AuthGuard allowedRoles={["super_admin"]}>
            <AdminLayout>
                <div className="max-w-4xl mx-auto space-y-12 pb-24">
                    {/* Header */}
                    <div className="flex items-center gap-6">
                        <Link 
                            href="/admin/categories"
                            className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm transition-all hover:-translate-x-1"
                        >
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                                {isEditMode ? "Modify Category" : "Architect New Category"}
                            </h1>
                            <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-widest opacity-60">Catalog Taxonomy Control</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-10">
                            {/* Name & Icon */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Category Identity</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. Compliance & Audits"
                                        className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-base font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Visual representation</label>
                                    <IconPicker 
                                        value={form.icon}
                                        onChange={(icon) => setForm({ ...form, icon })}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Strategic Description</label>
                                <textarea 
                                    required
                                    rows={8}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Describe the scope of services covered under this category..."
                                    className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2rem] text-base font-medium text-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all outline-none resize-none leading-relaxed"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button 
                                type="submit"
                                disabled={saving}
                                className="flex-1 h-20 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/30 hover:bg-blue-600 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50"
                            >
                                {saving ? <i className="fas fa-circle-notch animate-spin text-xl"></i> : <i className="fas fa-save text-xl"></i>}
                                {isEditMode ? "Synchronize Category" : "Publish to Catalog"}
                            </button>
                            <Link 
                                href="/admin/categories"
                                className="h-20 px-12 bg-slate-100 text-slate-400 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all flex items-center justify-center"
                            >
                                Abort
                            </Link>
                        </div>
                    </form>
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
