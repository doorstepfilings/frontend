"use client";

import { useEffect, useMemo, useState } from "react";
import { PageLogoLoader } from "@/components/ui/logo-loader";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchMyServices, deleteMyService, downloadInvoice } from "@/lib/features/services/services-slice";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useStoredUser } from "@/lib/auth/hooks";
import { apiClient } from "@/lib/api/client";
import { OrderSummaryModal } from "@/components/services/order-summary-modal";
import {
    ImageLightbox,
    type ImageLightboxSlide,
} from "@/components/ui/image-lightbox";
import {
    StatusIndicator,
} from "@/components/ui/status-indicator";
import { getMilestoneState } from "@/lib/utils/status-helpers";
import { ChatNoteModal } from "@/components/ui/chat-note-modal";
import { format } from "date-fns";
import {
    buildDashboardDocumentsUrl,
} from "@/lib/utils/payment-navigation";
import {
    calculateServicePrice,
    formatPrice,
} from "@/lib/utils/pricing";
import {
    ensureDocumentAccessible,
    getDocumentSourceUrl,
    isImageDocument,
    openDocumentInNewTab,
    resolveStorageUrl,
    openBlobInNewTabOrDownload,
} from "@/lib/utils/document-helpers";
import {
    loadRazorpay,
    type RazorpayCheckoutOptions,
    type RazorpayPaymentResponse,
} from "@/lib/utils/razorpay";

type ServiceDocument = {
    document_type?: string | null;
    document_category?: string | null;
    document_name?: string | null;
    file_name?: string | null;
    file_url?: string | null;
    id: number | string;
    status?: string | null;
    notes?: string | null;
};

type DocumentLightboxItem = {
    docId: string;
    slide: ImageLightboxSlide;
};

type CreateOrderResponse = {
    data: {
        amount?: number | string;
        amount_paise?: number;
        currency: string;
        key_id: string;
        payment_id: number | string;
        razorpay_order_id: string;
    };
};

const PAYABLE_STATUSES = new Set(["applied", "draft", "payment_pending"]);

const HISTORY_STATUSES = new Set([
    "completed",
    "rejected",
    "cancelled",
]);

function canPayForService(service: { status?: string | null } | null | undefined) {
    return PAYABLE_STATUSES.has(String(service?.status || "").toLowerCase());
}

const getDocStatusLabel = (status?: string | null) => {
    const s = String(status || "").toLowerCase();
    if (s === "rejected" || s === "correction") return "Correction";
    if (s === "verified" || s === "approved") return "Verified";
    if (s === "pending") return "Pending Verification";
    return s || "Uploaded";
};

export function ServiceApplicationDetailView() {
    const { id } = useParams();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { myServices, loading } = useAppSelector((state) => state.services);
    const user = useStoredUser();
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [viewingNoteDoc, setViewingNoteDoc] = useState<ServiceDocument | null>(null);
    const [viewingNoteService, setViewingNoteService] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [invoiceDownloading, setInvoiceDownloading] = useState(false);

    useEffect(() => {
        if (myServices.length === 0) {
            dispatch(fetchMyServices());
        }
    }, [dispatch, myServices.length]);

    const service = useMemo(() => {
        return myServices.find((s) => String(s.id) === String(id));
    }, [myServices, id]);

    const assignedAccountant = useMemo(() => {
        return service?.accountant || service?.user?.accountant || null;
    }, [service]);

    const assignedRM = useMemo(() => {
        return service?.user?.regional_manager || null;
    }, [service]);

    const { currentStep, isWarning } = useMemo(() => getMilestoneState(service?.status), [service?.status]);

    const noteCount = useMemo(() => {
        const notes = service?.update_note || service?.rejection_reason || "";
        if (!notes) return 0;
        return notes.split("\n\n").filter((n: string) => n.trim() !== "").length;
    }, [service?.update_note, service?.rejection_reason]);

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

    const handleOpenDocument = async (doc: ServiceDocument) => {
        try {
            await openDocumentInNewTab(
                getDocumentSourceUrl(doc),
                doc.file_name ?? doc.document_name ?? "document",
            );
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Unable to open this document.";
            toast.error(message);
        }
    };

    const handleOpenPreview = async (previewIndex: number) => {
        const slide = documentGallery[previewIndex]?.slide;
        if (!slide) {
            return;
        }

        try {
            await ensureDocumentAccessible(slide.src);
            setLightboxIndex(previewIndex);
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Unable to preview this image.";
            toast.error(message);
        }
    };

    const handleConfirmPayment = async () => {
        if (!service?.id) {
            return;
        }

        const serviceId = Number(service.id);
        setPaymentLoading(true);

        try {
            const loaded = await loadRazorpay();
            if (!loaded || !window.Razorpay) {
                toast.error("Razorpay SDK failed to load. Please refresh and try again.");
                return;
            }

            const response = await apiClient.post<CreateOrderResponse>(
                "/payments/razorpay/order-single",
                {
                    user_service_id: service.id,
                },
            );
            const order = response.data.data;

            if (!order?.razorpay_order_id || !order?.key_id) {
                toast.error("Unable to create a payment order right now.");
                return;
            }

            const reportFailedPaymentAttempt = async (reason: string) => {
                try {
                    await apiClient.post("/payments/razorpay/fail", {
                        payment_id: order.payment_id,
                        reason,
                    });
                } catch (error) {
                    console.warn("Failed to report payment failure", error);
                } finally {
                    void dispatch(fetchMyServices());
                }
            };

            setShowOrderModal(false);

            const options: RazorpayCheckoutOptions = {
                amount:
                    order.amount_paise ?? Math.round(Number(order.amount || 0) * 100),
                currency: order.currency,
                description: "Doorstep service payment",
                handler: async (paymentResponse: RazorpayPaymentResponse) => {
                    try {
                        await apiClient.post("/payments/razorpay/verify", {
                            ...paymentResponse,
                            payment_id: order.payment_id,
                        });

                        router.replace(
                            buildDashboardDocumentsUrl({
                                message:
                                    "Payment successfully done. You can upload your documents now.",
                                orderId: order.razorpay_order_id,
                                paymentId: String(order.payment_id),
                                serviceIds: [String(serviceId)],
                                status: "success",
                            }),
                        );
                    } catch {
                        toast.error(
                            "Payment verification failed. Please check your dashboard documents.",
                        );
                    }
                },
                key: order.key_id,
                modal: {
                    ondismiss: async () => {
                        await reportFailedPaymentAttempt(
                            "Payment modal closed by user",
                        );
                    },
                },
                name: "DoorstepFilings",
                order_id: order.razorpay_order_id,
                prefill: {
                    contact: user?.mobile_number ?? undefined,
                    email: user?.email ?? undefined,
                    name: user?.name ?? undefined,
                },
                theme: {
                    color: "#1e3a8a",
                },
            };

            const checkout = new window.Razorpay(options);
            checkout.on("payment.failed", async (response) => {
                await reportFailedPaymentAttempt(
                    response.error?.description || "Payment failed",
                );
            });
            checkout.open();
        } catch {
            toast.error("Unable to initiate payment.");
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!service?.id) return;
        setDeleting(true);
        try {
            const resultAction = await dispatch(deleteMyService(service.id));
            if (deleteMyService.fulfilled.match(resultAction)) {
                toast.success("Application cancelled successfully");
                router.push("/dashboard/services");
            } else {
                const errorMsg = resultAction.payload as string || "Failed to cancel application.";
                toast.error(errorMsg);
            }
        } catch (error) {
            toast.error("An unexpected error occurred.");
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleDownloadInvoice = async (paymentId: number | string) => {
        try {
            setInvoiceDownloading(true);
            const blob = await dispatch(downloadInvoice(paymentId)).unwrap();
            openBlobInNewTabOrDownload(blob, `invoice-${paymentId}.pdf`);
        } catch (error: any) {
            toast.error(error || "Failed to download invoice.");
        } finally {
            setInvoiceDownloading(false);
        }
    };

    if (loading && !service) {
        return <PageLogoLoader label="Loading application..." />;
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

    const isPaid = ["paid", "success"].includes(String(service?.payment_status || "").toLowerCase());
    const progress = isPaid ? Math.round((currentStep / 5) * 100) : 0;

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

            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-10 shadow-sm space-y-8">
                {/* 1. Journey Tracker & Key Stats */}
                <div className="relative">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                            Journey Status
                        </h3>
                        <div>
                            <StatusIndicator status={service?.status} />
                        </div>
                    </div>

                    <div className="relative">
                        <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(30,58,138,0.3)] ${isWarning
                                    ? (service?.status === "update_required" ? "bg-red-500" : "bg-amber-500")
                                    : (service?.status === "completed" || service?.status === "approved" ? "bg-emerald-500" : "bg-blue-900")
                                    }`}
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Submission
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${service?.status === "completed" || service?.status === "approved" ? "text-emerald-600" : "text-blue-900"
                                }`}>
                                {progress}% Processed
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Completion
                            </span>
                        </div>
                    </div>

                    {(service?.update_note || service?.rejection_reason) && (
                        <div className={`mt-6 p-5 rounded-2xl border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${service?.status === "update_required"
                            ? "bg-red-50 border-red-100 text-red-950"
                            : "bg-blue-50/50 border-blue-100 text-blue-950"
                            }`}>
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-2 ${service?.status === "update_required" ? "text-red-600" : "text-blue-600"
                                    }`}>
                                    {service?.status === "update_required" ? (
                                        <>
                                            <i className="fas fa-exclamation-circle"></i>{" "}
                                            Attention Required
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-comment-dots"></i>{" "}
                                            Accountant Notes
                                        </>
                                    )}
                                </p>
                                <p className="text-sm font-bold leading-relaxed">
                                    {service?.status === "update_required"
                                        ? "Your accountant has requested some updates."
                                        : "Your accountant has left comments/notes regarding this service."}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingNoteService(true)}
                                className={`shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all uppercase tracking-widest flex items-center gap-2 ${service?.status === "update_required"
                                    ? "bg-red-600 text-white hover:bg-red-700 shadow-red-500/20"
                                    : "bg-blue-900 text-white hover:bg-blue-800 shadow-blue-900/20"
                                    }`}
                            >
                                <i className="fas fa-comment-dots"></i> View Notes
                                {noteCount > 0 && (
                                    <span className="ml-1 bg-white/20 text-white rounded-full px-2 py-0.5 text-[9px] font-bold">
                                        {noteCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <hr className="border-slate-100" />

                {/* 2. Grid Section (3 columns on desktop) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Column A: Application Info */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                            Application Details
                        </h3>
                        <div className="space-y-4">
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

                    {/* Column B: Appointment Info */}
                    <div className="space-y-6 border-t border-slate-100 pt-6 md:border-t-0 md:pt-0 md:border-l md:pl-8">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                            Appointment Info
                        </h3>
                        {service?.form_data?.appointment_request === "yes" ? (
                            <div className="space-y-4">
                                <DetailItem
                                    label="Scheduled Date"
                                    value={service.form_data.scheduled_date}
                                />
                                <DetailItem
                                    label="Scheduled Time"
                                    value={service.form_data.scheduled_time}
                                />
                                <div className="flex items-center gap-2 text-emerald-600 mt-2">
                                    <i className="fas fa-check-circle text-xs"></i>
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        Confirmed Slot
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-400 text-xs font-medium italic uppercase tracking-wider">
                                No appointment requested
                            </div>
                        )}
                    </div>

                    {/* Column C: Support Team */}
                    <div className="space-y-6 border-t border-slate-100 pt-6 md:border-t-0 md:pt-0 md:border-l md:pl-8">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                            Support Team
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <i className="fas fa-user-tie"></i> Assigned Accountant
                                </p>
                                {assignedAccountant ? (
                                    <div className="space-y-0.5">
                                        <h4 className="text-sm font-black text-slate-900 leading-tight">
                                            {assignedAccountant.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-medium">
                                            {assignedAccountant.email}
                                        </p>
                                        {assignedAccountant.mobile_number && (
                                            <p className="text-xs text-slate-500 font-medium mt-1">
                                                <i className="fas fa-phone-alt mr-1"></i> {assignedAccountant.mobile_number}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider italic">
                                        Not Assigned Yet
                                    </p>
                                )}
                            </div>

                            <div>
                                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <i className="fas fa-user-shield"></i> Regional Manager
                                </p>
                                {assignedRM ? (
                                    <div className="space-y-0.5">
                                        <h4 className="text-sm font-black text-slate-900 leading-tight">
                                            {assignedRM.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-medium">
                                            {assignedRM.email}
                                        </p>
                                        {assignedRM.mobile_number && (
                                            <p className="text-xs text-slate-500 font-medium mt-1">
                                                <i className="fas fa-phone-alt mr-1"></i> {assignedRM.mobile_number}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider italic">
                                        Not Assigned Yet
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Transaction / Action Row */}
                {(canPayForService(service) || service?.payment_status === "paid") && (
                    <>
                        <hr className="border-slate-100" />
                        {canPayForService(service) && (
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black tracking-tight text-indigo-950">
                                        Complete Payment
                                    </h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                                        {String(service?.status || "").toLowerCase() === "payment_pending"
                                            ? "Your application is waiting for payment confirmation"
                                            : "Your application is ready for checkout"}
                                    </p>
                                    <div className="flex items-baseline gap-2 mt-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                            Service Fee:
                                        </span>
                                        <span className="text-2xl font-black tracking-tight text-indigo-900">
                                            INR {formatPrice(calculateServicePrice(service))}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 min-w-[240px]">
                                    <button
                                        onClick={() => setShowOrderModal(true)}
                                        className="flex h-12 px-6 items-center justify-center gap-3 rounded-xl bg-blue-900 text-[10px] font-black uppercase tracking-wider text-white transition-all hover:bg-blue-800 disabled:opacity-50 shadow-md shadow-blue-900/20"
                                        disabled={paymentLoading}
                                        type="button"
                                    >
                                        {paymentLoading ? (
                                            <i className="fas fa-spinner animate-spin" />
                                        ) : (
                                            <>
                                                <i className="fas fa-shopping-cart text-xs" />
                                                {String(service?.status || "").toLowerCase() ===
                                                    "payment_pending"
                                                    ? "Continue Payment"
                                                    : "Pay Now"}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="flex h-12 px-6 items-center justify-center gap-3 rounded-xl border border-red-200 bg-white text-[10px] font-black uppercase tracking-wider text-red-600 transition-all hover:bg-red-50 disabled:opacity-50"
                                        disabled={deleting}
                                        type="button"
                                    >
                                        {deleting ? (
                                            <i className="fas fa-spinner animate-spin" />
                                        ) : (
                                            <>
                                                <i className="fas fa-trash-alt text-xs" />
                                                Cancel Application
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {service?.payment_status === "paid" && (
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 md:p-8">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 tracking-tight">
                                            Payment Details
                                        </h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                                            Transaction Summary
                                        </p>
                                    </div>
                                    <span className="self-start sm:self-auto rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                        Paid
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <DetailItem
                                        label="Paid Amount"
                                        value={`INR ${formatPrice(service.amount || calculateServicePrice(service))}`}
                                    />
                                    {service.order_unique_id && (
                                        <DetailItem
                                            label="Order ID"
                                            value={service.order_unique_id}
                                        />
                                    )}
                                    {service.transaction_id && (
                                        <DetailItem
                                            label="Transaction ID"
                                            value={service.transaction_id}
                                        />
                                    )}
                                    {service.invoice_unique_id && (
                                        <DetailItem
                                            label="Invoice Number"
                                            value={service.invoice_unique_id}
                                        />
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-200/60">
                                    <div className="text-xs text-slate-500 font-bold">
                                        {service.payment_method && (
                                            <span className="mr-4">
                                                <span className="text-slate-400 font-medium">Method:</span> {service.payment_method}
                                            </span>
                                        )}
                                        {service.order_created_at && (
                                            <span>
                                                <span className="text-slate-400 font-medium">Paid On:</span> {format(
                                                    new Date(service.order_created_at),
                                                    "MMMM d, yyyy h:mm a",
                                                )}
                                            </span>
                                        )}
                                    </div>

                                    {service.payment_id && (
                                        <button
                                            onClick={() => handleDownloadInvoice(service.payment_id)}
                                            disabled={invoiceDownloading}
                                            className="flex h-10 px-5 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
                                            type="button"
                                        >
                                            {invoiceDownloading ? (
                                                <>
                                                    <i className="fas fa-spinner animate-spin" /> Downloading...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-file-pdf text-red-500" /> Download Invoice
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                <hr className="border-slate-100" />

                {/* 4. Documents List Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                            Documents List
                        </h3>
                        <Link
                            href="/dashboard/documents"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            <i className="fas fa-plus text-[8px]"></i> Upload Documents
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {service?.request_documents?.length === 0 ? (
                            <div className="sm:col-span-2 text-center py-8 border border-dashed border-slate-200 rounded-2xl">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                    No documents attached
                                </p>
                            </div>
                        ) : (
                            requestDocuments.map((doc) => {
                                const previewIndex =
                                    documentGallery.findIndex(
                                        (item) =>
                                            item.docId === String(doc.id),
                                    );

                                const isDeliverable = ["certificate", "report"].includes(doc.document_category || "");
                                const label = doc.document_name ||
                                    (doc.document_category ? (doc.document_category.charAt(0).toUpperCase() + doc.document_category.slice(1)) : null) ||
                                    doc.file_name;

                                return (
                                    <div
                                        key={doc.id}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isDeliverable
                                            ? "bg-emerald-50/60 border-emerald-100 hover:bg-emerald-50 shadow-sm"
                                            : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${isDeliverable ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                                <i className={`fas ${isDeliverable ? "fa-certificate" : "fa-file-alt"}`}></i>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-slate-800 truncate">
                                                    {label}
                                                </p>
                                                <p className={`text-[9px] font-bold uppercase tracking-tighter ${isDeliverable ? "text-emerald-600" : (doc.status === 'rejected' ? "text-amber-500 font-extrabold" : "text-slate-400")}`}>
                                                    {isDeliverable ? "Final Deliverable" : getDocStatusLabel(doc.status)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            {doc.notes && (
                                                <button
                                                    onClick={() => setViewingNoteDoc(doc)}
                                                    className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:border-amber-100 transition-colors shadow-sm"
                                                    title="View accountant note"
                                                    type="button"
                                                >
                                                    <i className="fas fa-comment-dots text-xs"></i>
                                                </button>
                                            )}
                                            {previewIndex >= 0 ? (
                                                <button
                                                    onClick={() =>
                                                        void handleOpenPreview(
                                                            previewIndex,
                                                        )
                                                    }
                                                    className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-colors shadow-sm"
                                                    title="Preview image"
                                                    type="button"
                                                >
                                                    <i className="fas fa-eye text-xs"></i>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        void handleOpenDocument(
                                                            doc,
                                                        )
                                                    }
                                                    className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-colors shadow-sm"
                                                    title="View document"
                                                    type="button"
                                                >
                                                    <i className="fas fa-download text-xs"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* 5. Help Helpline Footer */}
                <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-blue-900/10">
                    <div>
                        <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                            <i className="fab fa-whatsapp text-lg text-emerald-400"></i> Need Help with this Application?
                        </h3>
                        <p className="text-xs font-bold text-blue-100/80 leading-relaxed uppercase tracking-widest mt-1">
                            Directly communicate with your assigned accountant.
                        </p>
                    </div>
                    <a
                        href="https://wa.me/919898196396"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-white text-blue-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-md shrink-0 font-bold"
                    >
                        Contact Support
                    </a>
                </div>
            </div>

            <ImageLightbox
                open={lightboxIndex >= 0}
                index={lightboxIndex >= 0 ? lightboxIndex : 0}
                slides={documentGallery.map((item) => item.slide)}
                onClose={() => setLightboxIndex(-1)}
            />

            <ChatNoteModal
                isOpen={viewingNoteDoc !== null}
                onClose={() => setViewingNoteDoc(null)}
                noteText={viewingNoteDoc?.notes}
                contextName={
                    viewingNoteDoc?.document_name ||
                    (viewingNoteDoc?.document_category ? (viewingNoteDoc.document_category.charAt(0).toUpperCase() + viewingNoteDoc.document_category.slice(1)) : null) ||
                    viewingNoteDoc?.file_name ||
                    "Document"
                }
                userType="user"
            />

            <ChatNoteModal
                isOpen={viewingNoteService}
                onClose={() => setViewingNoteService(false)}
                title="Service Notes"
                contextName={service?.service?.name || "Service Application"}
                noteText={service?.update_note || service?.rejection_reason || ""}
                userType="user"
            />

            <OrderSummaryModal
                isOpen={showOrderModal}
                loading={paymentLoading}
                onClose={() => setShowOrderModal(false)}
                onConfirm={() => void handleConfirmPayment()}
                service={service ?? null}
            />

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={() => void handleConfirmDelete()}
                title="Cancel Application"
                message="Are you sure you want to cancel this application? This action cannot be undone."
                confirmLabel="Yes, Cancel"
                cancelLabel="No, Keep It"
                variant="danger"
                loading={deleting}
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



