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
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="bg-blue-950 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                Order Summary
              </p>
              <h2 className="mt-2 text-2xl font-black">Review before payment</h2>
              <p className="mt-2 text-sm leading-7 text-blue-100">
                Your application is saved. Confirm payment to continue processing.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/20"
            >
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
              {serviceDetails?.category?.name ?? "Service"}
            </p>
            <h3 className="mt-2 text-xl font-black text-slate-900">
              {serviceDetails?.name ?? "Selected Service"}
            </h3>
            {serviceDetails?.short_description ? (
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {serviceDetails.short_description}
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Price Breakdown
            </p>

            {selectedPlan ? (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-900">
                <i className="fas fa-tag mr-2 text-blue-600" />
                {selectedPlan.name}
              </div>
            ) : null}

            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Base Price</span>
                <span className="font-bold text-slate-900">
                  INR {basePrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>GST (18%)</span>
                <span className="font-bold text-slate-900">
                  INR {gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-dashed border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    Grand Total
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Including GST</p>
                </div>
                <span className="text-3xl font-black text-blue-950">
                  INR {formatPrice(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
            Government charges may still apply separately where the service requires them.
          </div>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Starting Payment..." : `Pay Now - INR ${formatPrice(grandTotal)}`}
            <i className={`fas ${loading ? "fa-spinner fa-spin" : "fa-lock"} text-xs`} />
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full text-sm font-bold text-slate-500 transition hover:text-slate-700 disabled:opacity-50"
          >
            Pay Later
          </button>
        </div>
      </div>
    </div>
  );
}
