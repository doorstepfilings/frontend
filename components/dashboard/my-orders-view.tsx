"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
    downloadInvoice,
    fetchMyOrders,
} from "@/lib/features/services/services-slice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { formatDateWithPattern } from "@/lib/utils/formatters";
import { buildCollectionKey } from "@/lib/utils/list-keys";

export function MyOrdersView() {
    const dispatch = useAppDispatch();
    const { myOrders, ordersLoading } = useAppSelector(
        (state) => state.services,
    );
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const getOrderStatus = (order: any) =>
        String(order.status || order.payment_status || "").toLowerCase();

    const canDownloadInvoice = (order: any) =>
        Boolean(
            order.invoice_available ??
                ["paid", "refunded"].includes(getOrderStatus(order)),
        );

    const getOrderStatusLabel = (order: any) => {
        const status = getOrderStatus(order);

        if (status === "paid") {
            return "Verified Payment";
        }

        if (status === "refunded") {
            return "Refunded";
        }

        if (status === "failed") {
            return "Payment Failed";
        }

        if (status === "cancelled") {
            return "Payment Cancelled";
        }

        return String(
            order.status || order.payment_status || "UNKNOWN",
        ).toUpperCase();
    };

    useEffect(() => {
        dispatch(fetchMyOrders());
    }, [dispatch]);

    const handleDownload = async (orderId: string) => {
        setDownloadingId(orderId);
        try {
            const blob = await dispatch(downloadInvoice(orderId)).unwrap();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `invoice-${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            toast.error(error || "Download failed");
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    Purchase History
                </h1>
                <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-500 opacity-60">
                    Manage your active subscriptions and invoices
                </p>
            </div>

            {ordersLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-900 border-t-transparent"></div>
                </div>
            ) : myOrders.length === 0 ? (
                <div className="rounded-[3rem] border-2 border-dashed border-slate-100 bg-white p-20 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-200">
                        <i className="fas fa-shopping-bag text-3xl"></i>
                    </div>
                    <h2 className="text-xl font-black text-slate-900">
                        No orders yet
                    </h2>
                    <p className="mb-8 mt-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                        You haven&apos;t purchased any services yet
                    </p>
                    <Link
                        href="/services"
                        className="inline-flex h-14 items-center rounded-2xl bg-blue-900 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:shadow-xl hover:shadow-blue-900/20"
                    >
                        Explore Services
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {myOrders.map((order: any, index: number) => (
                        <div
                            key={buildCollectionKey(order, index, "my-order", [
                                order.total_amount,
                                order.order_unique_id,
                            ])}
                            className="group overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md"
                        >
                            <div className="flex flex-col justify-between gap-6 border-b border-slate-50 bg-slate-50/50 p-8 md:flex-row md:items-center md:p-10">
                                <div className="flex flex-wrap items-center gap-10">
                                    <div>
                                        <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Order Placed
                                        </p>
                                        <p className="text-sm font-black tracking-tight text-slate-900">
                                            {formatDateWithPattern(
                                                order.created_at,
                                                "MMMM d, yyyy",
                                            )}
                                        </p>
                                    </div>
                                    <div className="hidden h-8 w-px bg-slate-200 md:block"></div>
                                    <div>
                                        <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Total Amount
                                        </p>
                                        <p className="text-sm font-black tracking-tight text-slate-900">
                                            INR{" "}
                                            {Math.round(order.amount).toLocaleString(
                                                "en-IN",
                                            )}
                                        </p>
                                    </div>
                                    <div className="hidden h-8 w-px bg-slate-200 md:block"></div>
                                    <div>
                                        <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Tax Summary
                                        </p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                            Incl. 18% GST (INR{" "}
                                            {Math.round(
                                                order.amount * 0.1525,
                                            ).toLocaleString("en-IN")}
                                            )
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col md:items-end">
                                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Order ID
                                    </p>
                                    <p className="font-mono text-xs font-black uppercase text-blue-900">
                                        #{order.order_unique_id || order.id}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-10 p-8 md:p-10">
                                {order.items?.map((item: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col gap-8 md:flex-row"
                                    >
                                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.5rem] bg-blue-50">
                                            <i className="fas fa-file-invoice text-2xl text-blue-900"></i>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                                <div>
                                                    <h3 className="mb-1 text-lg font-black tracking-tight text-slate-900">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                                                        Service Plan - Active
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`h-2 w-2 rounded-full ${
                                                            getOrderStatus(order) ===
                                                            "paid"
                                                                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                                                : getOrderStatus(
                                                                        order,
                                                                    ) ===
                                                                      "failed"
                                                                  ? "bg-red-500"
                                                                  : getOrderStatus(
                                                                          order,
                                                                      ) ===
                                                                        "cancelled"
                                                                    ? "bg-slate-500"
                                                                    : getOrderStatus(
                                                                            order,
                                                                        ) ===
                                                                          "refunded"
                                                                      ? "bg-amber-500"
                                                                      : "bg-slate-300"
                                                        }`}
                                                    ></div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                                                        {getOrderStatusLabel(
                                                            order,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-8 flex flex-wrap gap-3">
                                                <Link
                                                    href="/dashboard/services"
                                                    className="flex h-10 items-center justify-center rounded-xl bg-slate-900 px-6 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:shadow-lg hover:shadow-slate-900/20"
                                                >
                                                    Track Service
                                                </Link>
                                                <button className="h-10 rounded-xl border-2 border-slate-100 px-6 text-[9px] font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-slate-50">
                                                    Raise Support
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {canDownloadInvoice(order) && (
                                <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/30 px-8 py-6 md:px-10">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                        Txn ID:{" "}
                                        {order.payment_provider_transaction_id ||
                                            "N/A"}
                                    </p>
                                    <button
                                        onClick={() => handleDownload(order.id)}
                                        disabled={downloadingId === order.id}
                                        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-blue-900 transition-colors hover:text-blue-700 disabled:opacity-50"
                                    >
                                        {downloadingId === order.id ? (
                                            <i className="fas fa-spinner animate-spin"></i>
                                        ) : (
                                            <i className="fas fa-file-pdf text-rose-500"></i>
                                        )}
                                        Download Invoice
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
