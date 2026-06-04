"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchMyServices } from "@/lib/features/services/services-slice";
import { useStoredUser } from "@/lib/auth/hooks";
import { apiClient } from "@/lib/api/client";
import { OrderSummaryModal } from "@/components/services/order-summary-modal";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { resolveStatusLabel } from "@/lib/utils/status-helpers";
import { buildDashboardDocumentsUrl } from "@/lib/utils/payment-navigation";
import { calculateServicePrice, formatPrice } from "@/lib/utils/pricing";
import {
  loadRazorpay,
  type RazorpayCheckoutOptions,
  type RazorpayPaymentResponse,
} from "@/lib/utils/razorpay";
import { MilestoneTimeline } from "@/components/ui/milestone-timeline";
import { formatDateWithPattern } from "@/lib/utils/formatters";
import {
  useDocumentGallery,
  type ServiceDocument,
} from "@/lib/hooks/use-document-gallery";
import { DetailViewSkeleton } from "@/components/ui/skeletons/detail-view-skeleton";

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

const PAYABLE_STATUSES = new Set(["applied", "in_cart", "payment_pending"]);

function canPayForService(
  service:
    | { status?: string | null; payment_status?: string | null }
    | null
    | undefined,
) {
  if (String(service?.payment_status || "").toLowerCase() === "paid") {
    return false;
  }
  return PAYABLE_STATUSES.has(String(service?.status || "").toLowerCase());
}

export function ServiceApplicationDetailView() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { myServices, loading } = useAppSelector((state) => state.services);
  const user = useStoredUser();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    void dispatch(fetchMyServices());

    const intervalId = window.setInterval(() => {
      void dispatch(fetchMyServices());
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [dispatch, id]);

  const service = useMemo(() => {
    return myServices.find((s) => String(s.id) === String(id));
  }, [myServices, id]);

  const requestDocuments = useMemo(
    () => (service?.request_documents ?? []) as ServiceDocument[],
    [service?.request_documents],
  );

  const {
    documentGallery,
    lightboxIndex,
    setLightboxIndex,
    handleOpenDocument,
    handleOpenPreview,
  } = useDocumentGallery(requestDocuments);

  const handleConfirmPayment = async () => {
    if (!service?.id) {
      return;
    }

    const serviceId = Number(service.id);
    setPaymentLoading(true);

    try {
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        toast.error(
          "Razorpay SDK failed to load. Please refresh and try again.",
        );
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
            await reportFailedPaymentAttempt("Payment modal closed by user");
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

  if (loading) {
    return <DetailViewSkeleton />;
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

  const timelineStages = (
    service?.progress?.stages ??
    service?.journey?.stages ??
    []
  ).map((stage: any, index: number) => ({
    id: Number(stage.id ?? index),
    stage_id: stage.stage_id ?? null,
    name: stage.label ?? stage.name ?? "",
    slug: stage.key ?? stage.slug ?? "",
    color: stage.color ?? "#1d4ed8",
    order_index: stage.order_index ?? index + 1,
    is_active: stage.is_active ?? true,
    is_required: stage.is_required ?? true,
    is_completed: stage.is_completed ?? false,
    is_current: stage.is_current ?? false,
    timeline_index: index + 1,
    timeline_key: `${stage.id ?? index}-${index}`,
  }));

  const currentStage =
    timelineStages.find((stage: any) => stage.is_current) ?? null;

  const currentOrder = currentStage?.timeline_index ?? null;

  const trackFill = (() => {
    if (timelineStages.length <= 1) return 0;
    const currentIdx = timelineStages.findIndex(
      (stage: any) => stage.is_current,
    );
    if (currentIdx >= 0) {
      return currentIdx / (timelineStages.length - 1);
    }
    const completedCount = timelineStages.filter(
      (stage: any) => stage.is_completed,
    ).length;
    return completedCount === timelineStages.length ? 1 : 0;
  })();

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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {service?.service?.name}
          </h1>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
            Application ID: #{service?.application_unique_id || service?.id}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Status Progress Card */}
          <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10">
              <StatusIndicator
                status={service?.status}
                paymentStatus={service?.payment_status}
                label={resolveStatusLabel(service)}
              />
            </div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-10">
              Journey Status
            </h3>

            <div className="mt-8">
              <MilestoneTimeline
                timelineStages={timelineStages}
                currentWorkflowStage={currentStage}
                currentWorkflowOrder={currentOrder}
                workflowTrackFill={trackFill}
                hasCustomWorkflow={timelineStages.length > 0}
                status={service?.status}
                stepIndex={(() => {
                  const steps = [
                    "applied",
                    "under_review",
                    "in_progress",
                    "submitted_to_ca",
                    "completed",
                  ];
                  const idx = steps.indexOf(service?.status || "");
                  return idx >= 0 ? idx : 0;
                })()}
                statusLabels={{
                  applied: "New Application",
                  under_review: "Verifying Documents",
                  in_progress: "Processing Task",
                  submitted_to_ca: "Pending CA Approval",
                  completed: "Completed",
                }}
              />
            </div>

            {service?.client_message && (
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-[2rem] border border-blue-100/60 flex gap-4 items-start animate-fadeIn">
                <div className="h-10 w-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-md flex-shrink-0">
                  <i className="fas fa-comment-dots text-xs"></i>
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
                    Update from Expert Advisor
                  </p>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    {service.client_message}
                  </p>
                </div>
              </div>
            )}

            {service?.status === "update_required" && (
              <div className="mt-10 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <i className="fas fa-exclamation-circle"></i> Attention
                  Required
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
                  value={formatDateWithPattern(
                    service?.created_at,
                    "MMMM d, yyyy",
                  )}
                />
                <DetailItem
                  label="Category"
                  value={service?.service?.category?.name || "General"}
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
              {service?.form_data?.appointment_request === "yes" ? (
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
          {canPayForService(service) && (
            <div className="bg-white rounded-[3rem] border border-indigo-100 p-10 shadow-sm">
              <h3 className="text-lg font-black tracking-tight text-slate-900">
                Complete Payment
              </h3>
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-500">
                {String(service?.status || "").toLowerCase() ===
                "payment_pending"
                  ? "Your application is waiting for payment confirmation"
                  : "Your application is ready for checkout"}
              </p>

              <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  Service Fee
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-indigo-900">
                  INR {formatPrice(calculateServicePrice(service))}
                </p>
              </div>

              <button
                onClick={() => setShowOrderModal(true)}
                className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-900 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-blue-800 disabled:opacity-50"
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
            </div>
          )}

          {/* Documents Segment */}
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-900/20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black tracking-tight">Documents</h3>
              <Link
                href={`/dashboard/documents?service_ids=${service?.id}`}
                className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <i className="fas fa-plus text-xs"></i>
              </Link>
            </div>
            <div className="space-y-4">
              {service?.request_documents?.length === 0 ? (
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center py-4">
                  No documents attached
                </p>
              ) : (
                requestDocuments.map((doc) => {
                  const previewIndex = documentGallery.findIndex(
                    (item) => item.docId === String(doc.id),
                  );

                  const isDeliverable = ["certificate", "report"].includes(
                    doc.document_category || "",
                  );
                  const label =
                    doc.document_name ||
                    (doc.document_category
                      ? doc.document_category.charAt(0).toUpperCase() +
                        doc.document_category.slice(1)
                      : null) ||
                    doc.file_name;

                  return (
                    <div
                      key={doc.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-4 group ${
                        isDeliverable
                          ? "bg-blue-600/20 border-blue-500/30 hover:bg-blue-600/30 shadow-lg shadow-blue-900/40"
                          : "bg-white/5 border-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center ${isDeliverable ? "bg-blue-500 text-white" : "bg-white/10 text-blue-400"}`}
                        >
                          <i
                            className={`fas ${isDeliverable ? "fa-certificate" : "fa-file-alt"} ${isDeliverable ? "" : "text-blue-400"}`}
                          ></i>
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-[11px] font-black uppercase tracking-widest truncate max-w-[120px] ${isDeliverable ? "text-blue-100" : "text-white"}`}
                          >
                            {label}
                          </p>
                          <p
                            className={`text-[9px] font-bold uppercase tracking-tighter ${isDeliverable ? "text-blue-300" : "text-slate-500"}`}
                          >
                            {isDeliverable
                              ? "Final Deliverable"
                              : doc.status || "Uploaded"}
                          </p>
                          {doc.notes && (
                            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-400 bg-white/5 border border-white/10 p-2 rounded-xl max-w-xs break-words">
                              {doc.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {previewIndex >= 0 ? (
                          <button
                            onClick={() => void handleOpenPreview(previewIndex)}
                            className={`${isDeliverable ? "text-blue-200 hover:text-white" : "text-slate-400 hover:text-white"} transition-colors`}
                            title="Preview image"
                            type="button"
                          >
                            <i className="fas fa-eye text-xs"></i>
                          </button>
                        ) : null}
                        <button
                          onClick={() => void handleOpenDocument(doc)}
                          className={`${isDeliverable ? "text-blue-200 hover:text-white" : "text-slate-500 hover:text-white"} transition-colors`}
                          type="button"
                        >
                          <i className="fas fa-download text-xs"></i>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Live Expert Consultation Chat - hidden */}
          {/* <div className="space-y-4">
                        <ChatBox
                            title="Live Expert Consultation"
                            userServiceId={Number(service?.id)}
                            counterpart={service?.accountant ? {
                                id: Number(service.accountant.id),
                                name: service.accountant.name,
                                email: service.accountant.email,
                                role: service.accountant.role,
                            } : null}
                        />
                    </div> */}
        </div>
      </div>

      <ImageLightbox
        key={
          lightboxIndex >= 0
            ? `${lightboxIndex}-${documentGallery.length}`
            : "closed"
        }
        open={lightboxIndex >= 0}
        index={lightboxIndex >= 0 ? lightboxIndex : 0}
        slides={documentGallery.map((item) => item.slide)}
        onClose={() => setLightboxIndex(-1)}
      />

      <OrderSummaryModal
        isOpen={showOrderModal}
        loading={paymentLoading}
        onClose={() => setShowOrderModal(false)}
        onConfirm={() => void handleConfirmPayment()}
        service={service ?? null}
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
