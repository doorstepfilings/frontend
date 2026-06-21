"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import { OrderSummaryModal } from "@/components/services/order-summary-modal";
import {
  fetchMyOrders,
  fetchMyServices,
} from "@/lib/features/services/services-slice";
import { useStoredUser } from "@/lib/auth/hooks";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { PageLogoLoader } from "@/components/ui/logo-loader";
import {
  forceDownload,
  isClientDeliveryDocument,
  resolveStorageUrl,
} from "@/lib/utils/document-helpers";
import { formatDate } from "@/lib/utils/formatters";
import { buildDashboardDocumentsUrl } from "@/lib/utils/payment-navigation";
import { calculateServicePrice, formatPrice } from "@/lib/utils/pricing";
import {
  getStatusColorClass,
  getStatusIcon,
  getStatusLabel,
} from "@/lib/utils/status-helpers";
import {
  loadRazorpay,
  type RazorpayCheckoutOptions,
  type RazorpayPaymentResponse,
} from "@/lib/utils/razorpay";

type DashboardService = {
  id: number;
  status: string;
  amount?: number | string | null;
  application_unique_id?: string | null;
  certificate_url?: string | null;
  created_at?: string;
  order_created_at?: string | null;
  form_data?: {
    pricing_plan?: string | null;
  } | null;
  update_note?: string | null;
  rejection_reason?: string | null;
  request_documents?: Array<{
    id: number;
    document_name?: string | null;
    document_type?: string | null;
    file_name?: string | null;
    file_url?: string | null;
    status?: string | null;
  }>;
  accountant?: {
    name?: string | null;
    email?: string | null;
  } | null;
  service?: {
    name?: string | null;
    short_description?: string | null;
    category?: {
      name?: string | null;
    } | null;
    pricing_plans?: Array<{
      name?: string | null;
      price?: number | string | null;
    }> | null;
  } | null;
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

const ACTIVE_STATUSES = new Set([
  "applied",
  "document_collection",
  "under_review",
  "update_required",
  "in_progress",
  "payment_pending",
  "paid",
]);

const HISTORY_STATUSES = new Set([
  "completed",
  "rejected",
  "cancelled",
]);

const PAYABLE_STATUSES = new Set([
  "applied",
  "draft",
  "payment_pending",
]);

function canPayForService(service: DashboardService | null | undefined) {
  return PAYABLE_STATUSES.has(String(service?.status || "").toLowerCase());
}

function canDeleteService(service: DashboardService | null | undefined) {
  return PAYABLE_STATUSES.has(String(service?.status || "").toLowerCase());
}

function getTrackingId(service: DashboardService) {
  return (
    service.application_unique_id || `DSF-TRK-${String(service.id).padStart(4, "0")}`
  );
}

function getDeliveredClientDocuments(
  documents: DashboardService["request_documents"] = [],
) {
  return (documents ?? []).filter((document) => {
    const resolvedUrl = resolveStorageUrl(document.file_url ?? null);
    return Boolean(resolvedUrl && isClientDeliveryDocument(document));
  });
}

export function DashboardServicesView() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useStoredUser();
  const hasFetched = useRef(false);
  const { myOrders, myServices, loading, error } = useAppSelector(
    (state) => state.services,
  );

  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "completed">(
    "all",
  );
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderService, setOrderService] = useState<DashboardService | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      void dispatch(fetchMyServices());
      void dispatch(fetchMyOrders());
    }
  }, [dispatch]);



  const filteredServices = useMemo(() => {
    return (myServices as DashboardService[])
      .filter((service) => {
        if (statusFilter === "all") {
          return true;
        }

        if (statusFilter === "in_progress") {
          return ACTIVE_STATUSES.has(String(service.status || "").toLowerCase());
        }

        return HISTORY_STATUSES.has(String(service.status || "").toLowerCase());
      })
      .sort(
        (left, right) =>
          new Date(
            right.order_created_at || right.created_at || 0,
          ).getTime() -
          new Date(
            left.order_created_at || left.created_at || 0,
          ).getTime(),
      );
  }, [myServices, statusFilter]);

  const stats = useMemo(() => {
    const services = myServices as DashboardService[];
    return {
      total: services.length,
      applied: services.filter((service) => service.status === "applied").length,
      inProgress: services.filter((service) =>
        ACTIVE_STATUSES.has(String(service.status || "").toLowerCase()),
      ).length,
      completed: services.filter((service) =>
        ["approved", "completed"].includes(String(service.status || "").toLowerCase()),
      ).length,
    };
  }, [myServices]);



  const refreshDashboardData = () => {
    void dispatch(fetchMyServices());
    void dispatch(fetchMyOrders());
  };

  const handleRetry = () => {
    hasFetched.current = false;
    refreshDashboardData();
  };

  const handleOpenOrderModal = (service: DashboardService) => {
    setOrderService(service);
    setShowOrderModal(true);
  };



  const handleConfirmPayment = async () => {
    if (!orderService?.id) {
      return;
    }

    const serviceId = orderService.id;
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
          user_service_id: orderService.id,
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
          refreshDashboardData();
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
            refreshDashboardData();
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

  if (loading && (myServices as DashboardService[]).length === 0) {
    return <PageLogoLoader label="Loading your services..." />;
  }

  if (error && (myServices as DashboardService[]).length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <i className="fas fa-exclamation-triangle text-3xl text-red-500" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-800">
          Unable to load services
        </h2>
        <p className="mb-6 text-gray-600">{error}</p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-6 py-3 font-semibold text-white hover:bg-blue-800"
          type="button"
        >
          <i className="fas fa-redo" /> Try Again
        </button>
      </div>
    );
  }

  const selectedService = null;
  const deliveredDocuments: DashboardService["request_documents"] = [];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Services</h1>
            <p className="text-xs text-gray-500">
              Monitor your active services, orders, and payment history.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon="fa-shopping-bag"
            iconColor="bg-blue-50 text-blue-600"
            label="Total Orders"
            value={myOrders.length}
          />
          <StatCard
            icon="fa-clipboard-check"
            iconColor="bg-emerald-50 text-emerald-600"
            label="Active Services"
            value={stats.total}
          />
          <StatCard
            icon="fa-clock"
            iconColor="bg-amber-50 text-amber-600"
            label="In Progress"
            value={stats.inProgress}
          />
          <StatCard
            icon="fa-check-double"
            iconColor="bg-gray-50 text-gray-600"
            label="Completed"
            value={stats.completed}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <div className="min-h-[500px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex border-b border-gray-100 px-4">
                {[
                  { key: "all", label: "All Services" },
                  { key: "in_progress", label: "Active" },
                  { key: "completed", label: "History" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() =>
                      setStatusFilter(
                        tab.key as "all" | "in_progress" | "completed",
                      )
                    }
                    className={`relative px-6 py-4 text-sm font-bold transition-all ${statusFilter === tab.key
                      ? "text-blue-900"
                      : "text-gray-400 hover:text-gray-600"
                      }`}
                    type="button"
                  >
                    {tab.label}
                    {statusFilter === tab.key ? (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-blue-900" />
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="p-0">
                {filteredServices.length === 0 ? (
                  <div className="p-20 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
                      <i className="fas fa-folder-open text-xl text-gray-200" />
                    </div>
                    <p className="text-sm font-medium uppercase tracking-widest text-gray-400">
                      No matching services found
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {filteredServices.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => router.push(`/dashboard/services/${service.id}`)}
                        className="group flex cursor-pointer items-center justify-between p-6 transition-all hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl border ${getStatusColorClass(
                              service.status,
                            )}`}
                          >
                            <i className={`fas ${getStatusIcon(service.status)} text-lg`} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">
                              {service.service?.name ?? "Service Application"}
                            </h4>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                {formatDate(
                                  service.order_created_at ||
                                    service.created_at,
                                )}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-gray-200" />
                              <span className="font-mono text-[10px] tracking-tighter text-gray-400">
                                ID: {getTrackingId(service)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span
                            className={`rounded-lg border px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${getStatusColorClass(
                              service.status,
                            )}`}
                          >
                            {getStatusLabel(service.status)}
                          </span>
                          {canPayForService(service) ? (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenOrderModal(service);
                              }}
                              className="flex items-center gap-2 rounded-lg bg-blue-900 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-blue-800"
                              type="button"
                            >
                              <i className="fas fa-shopping-cart text-xs" />
                              {String(service.status || "").toLowerCase() === "payment_pending"
                                ? "Pay Now"
                                : "Checkout"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">


            <div className="relative overflow-hidden rounded-2xl bg-blue-900 p-6 text-white shadow-xl shadow-blue-900/10">
              <i className="fas fa-wallet absolute -bottom-4 -right-4 text-7xl text-white/5" />
              <h4 className="mb-4 text-sm font-bold">Financial Overview</h4>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-white/10 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100">
                    Recent Transactions
                  </span>
                  <span className="text-sm font-bold">{myOrders.length}</span>
                </div>
                <Link
                  href="/dashboard/transactions"
                  className="flex w-full items-center justify-center rounded-xl bg-white py-2 text-[10px] font-bold uppercase tracking-widest text-blue-900 transition-all hover:bg-blue-50"
                >
                  View Full History
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <OrderSummaryModal
        isOpen={showOrderModal}
        loading={paymentLoading}
        onClose={() => {
          setShowOrderModal(false);
          setOrderService(null);
        }}
        onConfirm={() => void handleConfirmPayment()}
        service={orderService}
      />


    </>
  );
}

function StatCard({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconColor}`}>
          <i className={`fas ${icon} text-lg`} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {label}
          </p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className={`font-bold text-gray-800 ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
