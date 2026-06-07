"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchMyServices } from "@/lib/features/services/services-slice";
import Link from "next/link";
import { format } from "date-fns";
import { buildCollectionKey } from "@/lib/utils/list-keys";

import { PageLogoLoader } from "@/components/ui/logo-loader";

export function CertificatesView() {
    const dispatch = useAppDispatch();
    const { myServices, loading } = useAppSelector((state) => state.services);

    useEffect(() => {
        dispatch(fetchMyServices());
    }, [dispatch]);

    const certificates = (myServices || []).flatMap((service: any) => {
        return (service.request_documents || [])
            .filter((doc: any) => {
                const isFinal = doc.is_final === 1 || doc.is_final === true;
                const fileName = String(doc.file_name || "").toLowerCase();
                const category = String(doc.document_category || "").toLowerCase();
                return isFinal && !fileName.includes("report") && !category.includes("report");
            })
            .map((doc: any) => ({
                id: doc.id,
                rowKey: `certificate:${service.id ?? "service"}:${doc.id ?? "doc"}:${doc.file_name ?? ""}`,
                serviceName: service.service?.name,
                docName: doc.document_name || doc.document_category || "Final Certificate",
                url: doc.file_url,
                date: doc.created_at || service.updated_at,
                fileName: doc.file_name
            }));
    });

    return (
        <div className="space-y-10 animate-fadeIn">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Official Certificates</h1>
                <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Verified registrations and compliance documents</p>
            </div>

            {loading ? (
                <PageLogoLoader label="Loading certificates..." />
            ) : certificates.length === 0 ? (
                <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 p-24 text-center shadow-sm">
                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <i className="fas fa-award text-3xl"></i>
                    </div>
                    <h2 className="text-xl font-black text-slate-900">No certificates yet</h2>
                    <p className="text-sm text-slate-400 font-bold mt-2 uppercase tracking-widest mb-10">Certificates appear here once your services are completed</p>
                    <Link href="/dashboard/services" className="h-14 px-10 bg-blue-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] inline-flex items-center hover:shadow-xl hover:shadow-blue-900/20 transition-all">
                        View Service Status
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {certificates.map((c, index) => (
                        <div key={buildCollectionKey(c, index, "certificate", [c.rowKey, c.serviceName])} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group">
                            <div className="aspect-[1.5] bg-slate-900 relative flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-blue-600/20 mix-blend-overlay"></div>
                                <div className="relative text-center p-10">
                                    <div className="h-20 w-20 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                        <i className="fas fa-award text-3xl text-white"></i>
                                    </div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">{c.docName}</p>
                                    <h3 className="text-base font-black text-white leading-tight">{c.serviceName}</h3>
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issued On</p>
                                        <p className="text-sm font-black text-slate-900">{format(new Date(c.date), 'MMM d, yyyy')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">Official</span>
                                    </div>
                                </div>
                                <a 
                                    href={c.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full h-14 bg-blue-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/10"
                                >
                                    <i className="fas fa-download"></i>
                                    Download Document
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
