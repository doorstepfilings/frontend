"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { downloadInvoice, fetchMyOrders } from "@/lib/features/services/services-slice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { openBlobInNewTabOrDownload } from "@/lib/utils/document-helpers";
import { formatDateWithPattern } from "@/lib/utils/formatters";

export function TransactionHistoryView() {
  const dispatch = useAppDispatch();
  const { myOrders, ordersLoading, ordersError } = useAppSelector(
    (state) => state.services,
  );
  const [downloadingId, setDownloadingId] = useState<number | string | null>(null);

  useEffect(() => {
    void dispatch(fetchMyOrders());
  }, [dispatch]);

  const handleDownload = async (paymentId: number | string) => {
    try {
      setDownloadingId(paymentId);
      const blob = await dispatch(downloadInvoice(paymentId)).unwrap();
      openBlobInNewTabOrDownload(blob, `invoice-${paymentId}.pdf`);
    } catch (error: any) {
      toast.error(error || "Failed to download invoice.");
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (String(status || "").toLowerCase()) {
      case "paid":
      case "success":
        return "bg-green-100 text-green-700 border-green-200";
      case "refunded":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
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
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
            <p className="text-gray-500">
              Comprehensive log of all your payments and refunds
            </p>
          </div>
        </div>
      </div>

      {ordersError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {ordersError}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="border-b border-gray-100 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Order ID
                </th>
                <th className="border-b border-gray-100 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Transaction ID
                </th>
                <th className="border-b border-gray-100 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Date
                </th>
                <th className="border-b border-gray-100 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Services
                </th>
                <th className="border-b border-gray-100 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Amount
                </th>
                <th className="border-b border-gray-100 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Status
                </th>
                <th className="border-b border-gray-100 px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {myOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                myOrders.map((order: any) => (
                  <tr key={order.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-gray-700">
                        {order.order_unique_id || `ORD-${order.id}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-500">
                        {order.payment_provider_transaction_id || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDateWithPattern(order.created_at, "d MMM yyyy", "N/A")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        {order.items?.map((item: any, index: number) => (
                          <span
                            key={`${order.id}-${index}`}
                            className="max-w-[150px] truncate text-xs font-semibold text-blue-900"
                          >
                            {item.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      INR {Math.round(parseFloat(order.amount)).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.status === "paid" ? (
                        <button
                          onClick={() => void handleDownload(order.id)}
                          disabled={downloadingId === order.id}
                          className="ml-3 text-xs font-bold text-blue-600 transition-colors hover:text-blue-700"
                          type="button"
                        >
                          {downloadingId === order.id ? (
                            <i className="fas fa-spinner animate-spin" />
                          ) : (
                            <>
                              <i className="fas fa-download mr-1" /> Invoice
                            </>
                          )}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
