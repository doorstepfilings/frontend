import { Suspense } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { PaymentSuccessView } from "@/components/payments/payment-success-view";

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessFallback />}>
      <PaymentSuccessView />
    </Suspense>
  );
}

function PaymentSuccessFallback() {
  return (
    <PublicShell>
      <section className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <i className="fas fa-receipt" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-900">
            Preparing payment status...
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
