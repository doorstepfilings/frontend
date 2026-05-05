"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchMyServices } from "@/lib/features/services/services-slice";
import {
    ImageLightbox,
    type ImageLightboxSlide,
} from "@/components/ui/image-lightbox";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { format } from "date-fns";
import Link from "next/link";
import {
    isImageDocument,
    resolveStorageUrl,
} from "@/lib/utils/document-helpers";

type ServiceDocument = {
    document_type?: string | null;
    file_name?: string | null;
    file_url?: string | null;
    id: number | string;
    status?: string | null;
};

type DocumentLightboxItem = {
    docId: string;
    slide: ImageLightboxSlide;
};

export function ServiceApplicationDetailView() {
    const { id } = useParams();
    const dispatch = useAppDispatch();
    const { myServices, loading } = useAppSelector((state) => state.services);
    const [lightboxIndex, setLightboxIndex] = useState(-1);

    useEffect(() => {
        if (myServices.length === 0) {
            dispatch(fetchMyServices());
        }
    }, [dispatch, myServices.length]);

    const service = useMemo(() => {
        return myServices.find((s) => String(s.id) === String(id));
    }, [myServices, id]);

    const requestDocuments = useMemo(
        () => (service?.request_documents ?? []) as ServiceDocument[],
        [service?.request_documents],
    );

    const documentGallery = useMemo(
        () =>
            requestDocuments.reduce<DocumentLightboxItem[]>((gallery, doc) => {
                const src = resolveStorageUrl(doc.file_url ?? null);
                if (!src || !isImageDocument(doc)) {
                    return gallery;
                }

                gallery.push({
                    docId: String(doc.id),
                    slide: {
                        alt:
                            doc.document_type ||
                            doc.file_name ||
                            "Document preview",
                        download: doc.file_name
                            ? {
                                  filename: doc.file_name,
                                  url: src,
                              }
                            : src,
                        src,
                    },
                });

                return gallery;
            }, []),
        [requestDocuments],
    );

    if (loading && !service) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-900 border-t-transparent"></div>
            </div>
        );
    }

    if (!service && !loading) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-black text-slate-900">
                    Application not found
                </h2>
                <Link
                    href="/dashboard/services"
                    className="text-blue-600 font-bold mt-4 inline-block"
                >
                    Back to My Services
                </Link>
            </div>
        );
    }

    const progress = getProgressPercentage(service?.status);

    return (
        <div className="space-y-10 animate-fadeIn">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/services"
                    className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-900 transition-all"
                >
                    <i className="fas fa-arrow-left"></i>
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        {service?.service?.name}
                    </h1>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
                        Application ID: #
                        {service?.application_unique_id || service?.id}
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    {/* Status Progress Card */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10">
                            <StatusIndicator status={service?.status} />
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-10">
                            Journey Status
                        </h3>

                        <div className="relative">
                            <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-900 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(30,58,138,0.3)]"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-6">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Submission
                                </span>
                                <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">
                                    {progress}% Processed
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Completion
                                </span>
                            </div>
                        </div>

                        {service?.status === "update_required" && (
                            <div className="mt-10 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <i className="fas fa-exclamation-circle"></i>{" "}
                                    Attention Required
                                </p>
                                <p className="text-sm font-bold text-amber-900 leading-relaxed">
                                    {service.update_note}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Timeline / Details */}
                    <div className="grid md:grid-cols-2 gap-10">
                        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">
                                Application Details
                            </h3>
                            <div className="space-y-6">
                                <DetailItem
                                    label="Submission Date"
                                    value={format(
                                        new Date(service?.created_at),
                                        "MMMM d, yyyy",
                                    )}
                                />
                                <DetailItem
                                    label="Category"
                                    value={
                                        service?.service?.category?.name ||
                                        "General"
                                    }
                                />
                                {service?.form_data?.pricing_plan && (
                                    <DetailItem
                                        label="Selected Plan"
                                        value={service.form_data.pricing_plan}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">
                                Appointment Info
                            </h3>
                            {service?.form_data?.appointment_request ===
                            "yes" ? (
                                <div className="space-y-6">
                                    <DetailItem
                                        label="Scheduled Date"
                                        value={service.form_data.scheduled_date}
                                    />
                                    <DetailItem
                                        label="Scheduled Time"
                                        value={service.form_data.scheduled_time}
                                    />
                                    <div className="flex items-center gap-3 mt-4 text-emerald-600">
                                        <i className="fas fa-check-circle text-xs"></i>
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            Confirmed Slot
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-4 text-slate-400 text-[11px] font-bold uppercase tracking-widest italic">
                                    No appointment requested
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    {/* Documents Segment */}
                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-900/20">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black tracking-tight">
                                Documents
                            </h3>
                            <Link
                                href="/dashboard/documents"
                                className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                            >
                                <i className="fas fa-plus text-xs"></i>
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {service?.request_documents?.length === 0 ? (
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                    No documents attached
                                </p>
                            ) : (
                                requestDocuments.map((doc) => {
                                    const resolvedUrl = resolveStorageUrl(
                                        doc.file_url ?? null,
                                    );
                                    const previewIndex =
                                        documentGallery.findIndex(
                                            (item) =>
                                                item.docId === String(doc.id),
                                        );

                                    return (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                                    <i className="fas fa-file-alt text-blue-400"></i>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-black uppercase tracking-widest truncate max-w-[120px]">
                                                        {doc.document_type ||
                                                            doc.file_name}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                                        {doc.status}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {previewIndex >= 0 ? (
                                                    <button
                                                        onClick={() =>
                                                            setLightboxIndex(
                                                                previewIndex,
                                                            )
                                                        }
                                                        className="text-slate-400 hover:text-white transition-colors"
                                                        title="Preview image"
                                                        type="button"
                                                    >
                                                        <i className="fas fa-eye text-xs"></i>
                                                    </button>
                                                ) : null}
                                                <a
                                                    href={
                                                        resolvedUrl ?? undefined
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-slate-500 hover:text-white transition-colors"
                                                >
                                                    <i className="fas fa-download text-xs"></i>
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Support Quick Access */}
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] p-10 text-white">
                        <h3 className="text-lg font-black tracking-tight mb-4">
                            Need Help?
                        </h3>
                        <p className="text-xs font-bold text-blue-100 opacity-80 leading-relaxed mb-8 uppercase tracking-widest">
                            Directly communicate with your assigned accountant.
                        </p>
                        <a
                            href="https://wa.me/919898196396"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-3 h-14 bg-white text-blue-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg"
                        >
                            Contact Support
                        </a>
                    </div>
                </div>
            </div>

            <ImageLightbox
                open={lightboxIndex >= 0}
                index={lightboxIndex >= 0 ? lightboxIndex : 0}
                slides={documentGallery.map((item) => item.slide)}
                onClose={() => setLightboxIndex(-1)}
            />
        </div>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">
                {label}
            </p>
            <p className="text-sm font-black text-slate-900 tracking-tight">
                {value}
            </p>
        </div>
    );
}

function getProgressPercentage(status: string = "applied") {
    const states: Record<string, number> = {
        applied: 10,
        paid: 20,
        document_collection: 40,
        submitted_to_ca: 60,
        under_review: 80,
        update_required: 80,
        approved: 100,
        completed: 100,
        rejected: 100,
        cancelled: 0,
    };
    return states[status] || 10;
}
