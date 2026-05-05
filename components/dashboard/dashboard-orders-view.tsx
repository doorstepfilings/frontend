"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { downloadInvoice, fetchMyOrders } from "@/lib/features/services/services-slice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { openBlobInNewTabOrDownload } from "@/lib/utils/document-helpers";
import { formatDateWithPattern } from "@/lib/utils/formatters";
import { buildCollectionKey } from "@/lib/utils/list-keys";

export function DashboardOrdersView() {
  const dispatch = useAppDispatch();
  const { myOrders, ordersLoading, ordersError } = useAppSelector(
    (state) => state.services,
  );
  const [downloadingId, setDownloadingId] = useState<number | string | null>(null);

  useEffect(() => {
    void dispatch(fetchMyOrders());
  }, [dispatch]);

  const handleDownload = async (orderId: number | string) => {
    try {
      setDownloadingId(orderId);
      const blob = await dispatch(downloadInvoice(orderId)).unwrap();
      openBlobInNewTabOrDownload(blob, `invoice-${orderId}.pdf`);
    } catch (error: any) {
      toast.error(error || "Failed to download invoice.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (ordersLoading && myOrders.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
            <p className="text-gray-500">View and track your service purchases</p>
          </div>
        </div>
      </div>

      {ordersError ? (
        <div className="flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-6 text-red-600">
          <i className="fas fa-exclamation-circle text-2xl" />
          <p>{ordersError}</p>
        </div>
      ) : myOrders.length === 0 ? (
        <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-200">
            <i className="fas fa-shopping-bag text-3xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">No orders yet</h2>
          <p className="mx-auto max-w-sm text-gray-500">
            You haven&apos;t purchased any services yet. Explore our services to get started.
          </p>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-800"
          >
            Explore Services
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myOrders.map((order: any, index: number) => (
            <div
              key={buildCollectionKey(order, index, "dashboard-order", [
                order.id,
                order.order_unique_id,
              ])}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-col justify-between gap-4 border-b border-gray-50 bg-gray-50/30 p-4 sm:flex-row sm:items-center sm:p-6">
                <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Order Placed
                    </p>
                    <p className="text-sm font-bold text-gray-700">
                      {formatDateWithPattern(order.created_at, "d MMM yyyy", "N/A")}
                    </p>
                  </div>
                  <div className="flex gap-8 border-l border-gray-200 pl-8">
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Subtotal
                      </p>
                      <p className="text-sm font-bold text-gray-700">
                        INR{" "}
                        {parseFloat(
                          order.subtotal || order.amount / 1.18,
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        GST (18%)
                      </p>
                      <p className="text-sm font-bold text-gray-700">
                        INR{" "}
                        {parseFloat(
                          order.gst_amount || order.amount - order.amount / 1.18,
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Total Amount
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        INR {Math.round(parseFloat(order.amount)).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Order ID
                  </p>
                  <p className="font-mono text-xs font-bold text-gray-500">
                    {order.order_unique_id || `DSF-ORD-${String(order.id).padStart(4, "0")}`}
                  </p>
                </div>
              </div>

              <div className="space-y-6 p-4 sm:p-6">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-6 md:flex-row">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                      <i className="fas fa-file-invoice text-2xl text-blue-900" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <h3 className="cursor-pointer font-bold text-gray-900 transition-colors hover:text-blue-900">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500">
                        Service Plan - {String(item.status || "").replace(/_/g, " ")}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4">
                        <Link
                          href="/dashboard/services"
                          className="rounded-lg border border-blue-100 px-4 py-2 text-xs font-bold text-blue-900 transition-all hover:bg-blue-50"
                        >
                          View Service
                        </Link>
                        <button
                          className="rounded-lg border border-gray-100 px-4 py-2 text-xs font-bold text-gray-600 transition-all hover:bg-gray-50"
                          type="button"
                        >
                          Rate Service
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3 md:w-64">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            order.status === "paid"
                              ? "animate-pulse bg-green-500"
                              : order.status === "refunded"
                                ? "bg-amber-500"
                                : "bg-gray-400"
                          }`}
                        />
                        <p className="text-sm font-bold text-gray-800">
                          {order.status === "paid"
                            ? "Payment Successful"
                            : order.status === "refunded"
                              ? "Refunded"
                              : String(order.status || "")
                                  .charAt(0)
                                  .toUpperCase() + String(order.status || "").slice(1)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {order.status === "paid"
                          ? "Your transaction has been verified and processed successfully."
                          : order.status === "refunded"
                            ? "This payment has been refunded to your original payment method."
                            : "Your transaction is being processed."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-gray-50 bg-gray-50/50 px-6 py-4">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Transaction: {order.payment_provider_transaction_id || "-"}
                  </span>
                </div>
                {order.status === "paid" ? (
                  <button
                    onClick={() => void handleDownload(order.id)}
                    disabled={downloadingId === order.id}
                    className="flex items-center gap-2 text-xs font-bold text-blue-900 transition-all hover:text-blue-700 disabled:opacity-50"
                    type="button"
                  >
                    {downloadingId === order.id ? (
                      <>
                        <i className="fas fa-spinner animate-spin" /> Downloading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-file-pdf text-red-500" /> Download Invoice
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
