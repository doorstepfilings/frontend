"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchMyOrders, downloadInvoice } from "@/lib/features/services/services-slice";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { buildCollectionKey } from "@/lib/utils/list-keys";
import { PageLogoLoader } from "@/components/ui/logo-loader";

export function MyOrdersView() {
    const dispatch = useAppDispatch();
    const { myOrders, ordersLoading } = useAppSelector((state) => state.services);
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
            return "Payment Successful";
        }

        if (status === "refunded") {
            return "Refunded";
        }

        return "Pending Payment";
    };

    const getStatusColor = (order: any) => {
        const status = getOrderStatus(order);

        if (status === "paid") {
            return "bg-green-50 text-green-700 border-green-100";
        }

        if (status === "refunded") {
            return "bg-amber-50 text-amber-700 border-amber-100";
        }

        return "bg-blue-50 text-blue-700 border-blue-100";
    };

    useEffect(() => {
        dispatch(fetchMyOrders());
    }, [dispatch]);

    const handleDownload = async (orderId: string) => {
        try {
            setDownloadingId(orderId);
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
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Purchase History</h1>
                <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Manage your active subscriptions and invoices</p>
            </div>

            {ordersLoading ? (
                <PageLogoLoader label="Loading orders..." />
            ) : myOrders.length === 0 ? (
                <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 p-20 text-center">
                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <i className="fas fa-shopping-bag text-3xl"></i>
                    </div>
                    <h2 className="text-xl font-black text-slate-900">No orders yet</h2>
                    <p className="text-sm text-slate-400 font-bold mt-2 uppercase tracking-widest mb-8">You haven&apos;t purchased any services yet</p>
                    <Link href="/services" className="h-14 px-10 bg-blue-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] inline-flex items-center hover:shadow-xl hover:shadow-blue-900/20 transition-all">
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
                            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group"
                        >
                            {/* Order Header */}
                            <div className="p-8 md:p-10 bg-slate-50/50 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex flex-wrap items-center gap-10">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Order Placed</p>
                                        <p className="text-sm font-black text-slate-900 tracking-tight">{format(new Date(order.created_at), 'MMMM d, yyyy')}</p>
                                    </div>
                                    <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Amount</p>
                                        <p className="text-sm font-black text-slate-900 tracking-tight">₹{Math.round(order.amount).toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tax Summary</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Incl. 18% GST (₹{Math.round(order.amount * 0.1525).toLocaleString('en-IN')})</p>
                                    </div>
                                </div>
                                <div className="flex flex-col md:items-end">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Order ID</p>
                                    <p className="text-xs font-black font-mono text-blue-900 uppercase">#{order.order_unique_id || order.id}</p>
                                </div>
                            </div>

                            {/* Order Body */}
                            <div className="p-8 md:p-10 space-y-10">
                                {order.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex flex-col md:flex-row gap-8">
                                        <div className="h-20 w-20 rounded-[1.5rem] bg-blue-50 flex items-center justify-center shrink-0">
                                            <i className="fas fa-file-invoice text-blue-900 text-2xl"></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">{item.name}</h3>
                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Service Plan • Active</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`h-2 w-2 rounded-full ${
                                                            getOrderStatus(order) === "paid"
                                                                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                                                : getOrderStatus(order) === "failed"
                                                                    ? "bg-red-500"
                                                                    : getOrderStatus(order) === "cancelled"
                                                                        ? "bg-slate-500"
                                                                        : getOrderStatus(order) === "refunded"
                                                                            ? "bg-amber-500"
                                                                            : "bg-slate-300"
                                                        }`}
                                                    ></div>
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">
                                                        {getOrderStatusLabel(order)}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-8 flex flex-wrap gap-3">
                                                <Link 
                                                    href={`/dashboard/services`}
                                                    className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center hover:shadow-lg hover:shadow-slate-900/20 transition-all"
                                                >
                                                    Track Service
                                                </Link>
                                                <button className="h-10 px-6 border-2 border-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                                    Raise Support
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Footer */}
                            {canDownloadInvoice(order) && (
                                <div className="px-8 md:px-10 py-6 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Txn ID: {order.payment_provider_transaction_id || "N/A"}</p>
                                    <button 
                                        onClick={() => handleDownload(order.id)}
                                        disabled={downloadingId === order.id}
                                        className="flex items-center gap-3 text-[10px] font-black text-blue-900 uppercase tracking-widest hover:text-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {downloadingId === order.id ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-file-pdf text-rose-500"></i>}
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
