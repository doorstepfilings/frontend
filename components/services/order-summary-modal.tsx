"use client";

import { calculateServiceTotal, formatPrice } from "@/lib/utils/pricing";

type OrderSummaryService = {
  amount?: number | string | null;
  form_data?: {
    pricing_plan?: string | null;
  } | null;
  service?: {
    category?: {
      name?: string | null;
    } | null;
    name?: string | null;
    pricing_plans?: Array<{
      name?: string | null;
      price?: number | string | null;
    }> | null;
    short_description?: string | null;
  } | null;
};

type OrderSummaryModalProps = {
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  service: OrderSummaryService | null;
};

export function OrderSummaryModal({
  isOpen,
  loading,
  onClose,
  onConfirm,
  service,
}: OrderSummaryModalProps) {
  if (!isOpen || !service) {
    return null;
  }

  const serviceDetails = service.service ?? null;
  const selectedPlanName = service.form_data?.pricing_plan;
  const selectedPlan = selectedPlanName
    ? (serviceDetails?.pricing_plans ?? []).find((plan) => plan.name === selectedPlanName)
    : null;
  const { basePrice, gstAmount, grandTotal } = calculateServiceTotal(service);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close order summary"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-[#1e3a8a] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Application Summary</h2>
              <p className="mt-1 text-xs text-blue-100 font-medium">
                Review your order details before proceeding to payment.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <i className="fas fa-times text-lg" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">
              {serviceDetails?.category?.name ?? "Service"}
            </p>
            <h3 className="mt-1 text-lg font-bold text-gray-900">
              {serviceDetails?.name ?? "Selected Service"}
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Service Fee</span>
              <span className="font-bold text-gray-900">
                ₹{basePrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>GST (18%)</span>
              <span className="font-bold text-gray-900">
                ₹{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">Total Amount</p>
                  <p className="text-[10px] text-gray-500 font-medium italic">Including all applicable taxes</p>
                </div>
                <span className="text-2xl font-bold text-[#1e3a8a]">
                  ₹{formatPrice(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
             <div className="flex gap-3">
                <i className="fas fa-info-circle text-amber-500 mt-1"></i>
                <p className="text-xs leading-relaxed text-amber-900 font-medium">
                    Government charges and official fees may apply separately depending on your specific requirements.
                </p>
             </div>
          </div>

          <div className="space-y-3">
            <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#1e3a8a] px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-800 shadow-lg shadow-blue-900/20 disabled:opacity-50"
            >
                {loading ? (
                    <>
                        <i className="fas fa-spinner fa-spin" />
                        Initiating Payment...
                    </>
                ) : (
                    <>
                        <i className="fas fa-lock text-xs" />
                        Pay Securely ₹{formatPrice(grandTotal)}
                    </>
                )}
            </button>

            <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
                Pay Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
