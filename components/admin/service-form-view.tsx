"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import dynamic from 'next/dynamic';

// Shared Components
import { ToggleCard } from "@/components/ui/core/toggle-card";
import { FormField } from "@/components/ui/core/form-field";
import { DynamicList } from "@/components/ui/core/dynamic-list";
import { useFormHandler } from "@/hooks/use-form-handler";

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

const INITIAL_STATE = {
    service_category_id: '',
    name: '',
    short_description: '',
    long_description: '',
    price: '',
    pricing_plans: [] as any[],
    required_documents_list: [{ name: '', description: '', is_required: true }] as any[],
    extra_documents: [] as any[],
    faqs: [] as any[],
    admin_notes: '',
};

export function ServiceFormView() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const isEditMode = Boolean(id);

    const [categories, setCategories] = useState<any[]>([]);
    const [showPlans, setShowPlans] = useState(false);
    const [showExtraDocs, setShowExtraDocs] = useState(false);

    const {
        form,
        setForm,
        loading,
        setLoading,
        saving,
        handleChange,
        handleListUpdate,
        handleListAdd,
        handleListRemove,
        handleSubmit
    } = useFormHandler({
        initialValues: INITIAL_STATE,
        onSubmit: async (values) => {
            const endpoint = isEditMode ? `/admin/services/update/${id}` : "/admin/services/store";
            const payload = {
                ...values,
                pricing_plans: showPlans ? values.pricing_plans : [],
                extra_documents: showExtraDocs ? values.extra_documents : [],
            };
            await apiClient.post(endpoint, payload);
            router.push("/admin/services");
        },
        validate: (v) => {
            if (!v.service_category_id) return "Please select a parent category";
            if (!v.name) return "Service identity is required";
            if (!v.price) return "Base price is required";
            return null;
        },
        successMessage: `Service ${isEditMode ? 'calibrated' : 'commissioned'} successfully`
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const catRes = await apiClient.get("/admin/categories");
                setCategories(catRes.data?.data || catRes.data || []);

                if (isEditMode) {
                    const svcRes = await apiClient.get(`/admin/services/${id}`);
                    const data = svcRes.data?.data || svcRes.data;
                    if (!data) throw new Error("Service not found");

                    setShowPlans(data.pricing_plans?.length > 0);
                    setShowExtraDocs(data.extra_documents?.length > 0);
                    setForm({ ...INITIAL_STATE, ...data });
                }
            } catch (error: any) {
                toast.error("Failed to synchronize catalog data");
                if (isEditMode) router.push("/admin/services");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEditMode]);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-xl"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AuthGuard allowedRoles={["super_admin"]}>
            <AdminLayout>
                <div className="max-w-5xl mx-auto space-y-12 pb-24">
                    <div className="flex items-center gap-6">
                        <Link href="/admin/services" className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm transition-all hover:-translate-x-1">
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                                {isEditMode ? "Calibrate Service" : "Blueprint New Service"}
                            </h1>
                            <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-widest opacity-60">Service Engineering Hub</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Basic Configuration */}
                        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-10">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <FormField label="Parent Category" required>
                                    <select 
                                        value={form.service_category_id}
                                        onChange={(e) => handleChange("service_category_id", e.target.value)}
                                        className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all outline-none appearance-none"
                                    >
                                        <option value="">Select Category...</option>
                                        {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                    <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 pointer-events-none"></i>
                                </FormField>
                                <FormField label="Service Identity" required>
                                    <input 
                                        type="text" 
                                        value={form.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        placeholder="e.g. Private Limited Incorporation"
                                        className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all outline-none"
                                    />
                                </FormField>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2">
                                    <FormField label="Listing Summary" required>
                                        <input 
                                            type="text" 
                                            value={form.short_description}
                                            onChange={(e) => handleChange("short_description", e.target.value)}
                                            placeholder="Brief punchline for catalog view..."
                                            className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-medium text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all outline-none"
                                        />
                                    </FormField>
                                </div>
                                <FormField label="Base Price (₹)" required>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold">₹</span>
                                        <input 
                                            type="number" 
                                            value={form.price}
                                            onChange={(e) => handleChange("price", e.target.value)}
                                            className="w-full pl-12 pr-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                </FormField>
                            </div>
                        </div>

                        {/* Feature Toggles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <ToggleCard 
                                label="Pricing Tiers" 
                                description="Enable multiple service packages" 
                                checked={showPlans} 
                                onChange={(val) => {
                                    setShowPlans(val);
                                    if(val && form.pricing_plans.length === 0) handleListAdd("pricing_plans", { name: 'Standard', price: '', features: [''] });
                                }} 
                            />
                            <ToggleCard 
                                label="Optional Assets" 
                                description="Allow supplementary document uploads" 
                                checked={showExtraDocs} 
                                onChange={(val) => {
                                    setShowExtraDocs(val);
                                    if(val && form.extra_documents.length === 0) handleListAdd("extra_documents", { name: '', description: '' });
                                }} 
                            />
                        </div>

                        {/* Pricing Plans List */}
                        {showPlans && (
                            <DynamicList 
                                title="Service Tiers"
                                addLabel="Add Package"
                                items={form.pricing_plans}
                                onAdd={() => handleListAdd("pricing_plans", { name: '', price: '', features: [''] })}
                                onRemove={(idx) => handleListRemove("pricing_plans", idx)}
                                renderItem={(plan, idx) => (
                                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <FormField label="Plan Name">
                                                <input value={plan.name} onChange={(e) => handleListUpdate("pricing_plans", idx, "name", e.target.value)} className="w-full bg-white px-6 py-4 rounded-xl text-sm font-bold border-none outline-none" />
                                            </FormField>
                                            <FormField label="Price Label">
                                                <input value={plan.price} onChange={(e) => handleListUpdate("pricing_plans", idx, "price", e.target.value)} className="w-full bg-white px-6 py-4 rounded-xl text-sm font-bold border-none outline-none" />
                                            </FormField>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Included Features</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {plan.features.map((feat: string, fidx: number) => (
                                                    <div key={fidx} className="flex gap-2">
                                                        <input value={feat} onChange={(e) => {
                                                            const newFeats = [...plan.features];
                                                            newFeats[fidx] = e.target.value;
                                                            handleListUpdate("pricing_plans", idx, "features", newFeats);
                                                        }} className="flex-1 bg-white px-4 py-2.5 rounded-lg text-xs font-medium border-none outline-none" />
                                                        <button type="button" onClick={() => {
                                                            const newFeats = plan.features.filter((_: any, i: number) => i !== fidx);
                                                            handleListUpdate("pricing_plans", idx, "features", newFeats);
                                                        }} className="h-9 w-9 bg-white text-slate-300 hover:text-rose-500 rounded-lg transition-colors">
                                                            <i className="fas fa-times text-[10px]"></i>
                                                        </button>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => handleListUpdate("pricing_plans", idx, "features", [...plan.features, ""])} className="h-9 px-4 bg-white text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:border-blue-200 transition-all">+ Add Feature</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            />
                        )}

                        {/* Full Description */}
                        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-6">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Specifications</label>
                            <div className="rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-inner">
                                <ReactQuill theme="snow" value={form.long_description} onChange={(val) => handleChange("long_description", val)} className="min-h-[400px]" />
                            </div>
                        </div>

                        {/* Required Documents */}
                        <DynamicList 
                            title="Mandatory Requirements"
                            items={form.required_documents_list}
                            onAdd={() => handleListAdd("required_documents_list", { name: '', description: '', is_required: true })}
                            onRemove={(idx) => handleListRemove("required_documents_list", idx)}
                            renderItem={(doc, idx) => (
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                                    <input value={doc.name} onChange={(e) => handleListUpdate("required_documents_list", idx, "name", e.target.value)} placeholder="Document Label (e.g. PAN Card)" className="w-full bg-white px-5 py-3 rounded-xl text-sm font-black text-slate-900 border-none outline-none shadow-sm" />
                                    <textarea value={doc.description} onChange={(e) => handleListUpdate("required_documents_list", idx, "description", e.target.value)} placeholder="Technical Guidance for User..." rows={2} className="w-full bg-transparent px-5 py-3 text-xs font-medium text-slate-500 border-none outline-none resize-none" />
                                    <label className="flex items-center gap-3 px-2 cursor-pointer">
                                        <input type="checkbox" checked={doc.is_required} onChange={(e) => handleListUpdate("required_documents_list", idx, "is_required", e.target.checked)} className="w-4 h-4 rounded text-blue-600 border-slate-200" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mark as Mandatory</span>
                                    </label>
                                </div>
                            )}
                        />

                        {/* FAQs */}
                        <DynamicList 
                            title="Knowledge Base (FAQs)"
                            items={form.faqs}
                            onAdd={() => handleListAdd("faqs", { question: '', answer: '' })}
                            onRemove={(idx) => handleListRemove("faqs", idx)}
                            renderItem={(faq, idx) => (
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                                    <FormField label="Question">
                                        <input value={faq.question} onChange={(e) => handleListUpdate("faqs", idx, "question", e.target.value)} className="w-full bg-white px-6 py-4 rounded-xl text-sm font-bold border-none outline-none shadow-sm" />
                                    </FormField>
                                    <FormField label="Response">
                                        <textarea value={faq.answer} onChange={(e) => handleListUpdate("faqs", idx, "answer", e.target.value)} rows={3} className="w-full bg-white px-6 py-4 rounded-xl text-sm font-medium text-slate-600 border-none outline-none shadow-sm resize-none" />
                                    </FormField>
                                </div>
                            )}
                        />

                        {/* Internal Notes */}
                        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-6">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Internal Operations Notes</label>
                            <textarea value={form.admin_notes} onChange={(e) => handleChange("admin_notes", e.target.value)} rows={4} placeholder="Internal processing rules..." className="w-full bg-slate-50 border-none rounded-[2rem] p-8 text-sm font-medium text-slate-600 focus:bg-white transition-all outline-none" />
                        </div>

                        <div className="flex gap-4">
                            <button type="submit" disabled={saving} className="flex-1 h-20 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-blue-600 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
                                {saving ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-shield-check"></i>}
                                {isEditMode ? "Finalize & Publish Changes" : "Commission Global Service"}
                            </button>
                            <Link href="/admin/services" className="h-20 px-12 bg-slate-100 text-slate-400 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 flex items-center justify-center border border-slate-200/50">Abort</Link>
                        </div>
                    </form>
                </div>
            </AdminLayout>
            <style jsx global>{`
                .ql-toolbar.ql-snow { border: none !important; background: #f8fafc; padding: 1.5rem !important; border-bottom: 1px solid #f1f5f9 !important; }
                .ql-container.ql-snow { border: none !important; }
                .ql-editor { padding: 3rem !important; font-family: inherit; font-size: 1rem; line-height: 2; color: #334155; min-height: 400px; }
            `}</style>
        </AuthGuard>
    );
}
