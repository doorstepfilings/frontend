"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import {
  buildDashboardDocumentsUrl,
  normalizePaymentServiceIds,
} from "@/lib/utils/payment-navigation";

export function PaymentSuccessView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "success";
  const message = searchParams.get("message") ?? "Payment processed.";
  const paymentId = searchParams.get("payment_id") ?? "";
  const orderId = searchParams.get("order_id") ?? "";
  const serviceIds = normalizePaymentServiceIds(searchParams.get("service_ids"));

  useEffect(() => {
    if (status !== "success") {
      return;
    }

    router.replace(
      buildDashboardDocumentsUrl({
        status,
        message,
        paymentId,
        orderId,
        serviceIds,
      }),
    );
  }, [message, orderId, paymentId, router, serviceIds, status]);

  if (status === "success") {
    return (
      <PublicShell>
        <section className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-xl rounded-[2rem] border border-emerald-100 bg-emerald-50 p-10 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
              <i className="fas fa-check text-3xl" />
            </div>
            <h1 className="mt-6 text-3xl font-black text-slate-900">
              Payment Successful
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Redirecting you to the migrated dashboard documents route.
            </p>
          </div>
        </section>
      </PublicShell>
    );
  }

  const statusMap = {
    cancelled: {
      title: "Payment Cancelled",
      icon: "fa-ban",
      accent: "text-amber-600",
      panel: "border-amber-200 bg-amber-50",
      cta: { href: "/services", label: "Return to Services" },
    },
    error: {
      title: "Payment Error",
      icon: "fa-triangle-exclamation",
      accent: "text-rose-600",
      panel: "border-rose-200 bg-rose-50",
      cta: { href: "/login", label: "Back to Login" },
    },
  } as const;

  const current = statusMap[status as keyof typeof statusMap] ?? statusMap.error;

  return (
    <PublicShell>
      <section className="container mx-auto px-4 py-20">
        <div className={`mx-auto max-w-xl rounded-[2rem] border p-10 text-center ${current.panel}`}>
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ${current.accent}`}>
            <i className={`fas ${current.icon} text-3xl`} />
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-900">{current.title}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">{message}</p>
          {paymentId ? (
            <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Payment ID: {paymentId}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={current.cta.href}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-slate-800"
            >
              {current.cta.label}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-white"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
