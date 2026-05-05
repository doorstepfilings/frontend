"use client";

import React, { useEffect } from "react";
import { PolicyLayout } from "@/components/layout/policy-layout";
import { PublicShell } from "@/components/layout/public-shell";

const LAST_UPDATED = "04 April 2026";

export default function RefundPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      title: "1. Our Commitment",
      icon: "fa-handshake",
      content: (
        <div className="space-y-4">
          <p>
            At Doorstep Filings (“Company”, “We”, “Our”), we strive to deliver
            high-quality, timely, and reliable services in business
            registration, compliance, and advisory.
          </p>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="font-semibold text-blue-900">
              Customer satisfaction is our priority. If you are not satisfied, we
              encourage you to contact us immediately so we can resolve the
              issue, offer service correction, credit, or eligible refund.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "2. Cancellation Policy",
      icon: "fa-calendar-xmark",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="mb-2 flex items-center gap-2 font-bold text-emerald-800">
                <i className="fas fa-circle-check" />
                <h4>Before Service Initiation</h4>
              </div>
              <ul className="space-y-1 text-sm text-emerald-900">
                <li>• Cancellation is allowed</li>
                <li>• Eligible for full/partial refund</li>
              </ul>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
              <div className="mb-2 flex items-center gap-2 font-bold text-rose-800">
                <i className="fas fa-circle-xmark" />
                <h4>After Service Initiation</h4>
              </div>
              <p className="font-medium text-sm text-rose-900">
                Cancellation is not allowed once the service has begun.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <h4 className="mb-3 text-xs font-black uppercase italic tracking-widest text-gray-500 underline">
              Service is considered “Initiated” when:
            </h4>
            <ul className="grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <i className="fas fa-file-invoice text-[10px] text-gray-400" />{" "}
                Documents received & reviewed
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-comments text-[10px] text-gray-400" />{" "}
                Advisory has been provided
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-gavel text-[10px] text-gray-400" /> Filed
                with any authority
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-microchip text-[10px] text-gray-400" />{" "}
                Backend work has started
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "3. Refund Eligibility",
      icon: "fa-check-double",
      content: (
        <div className="space-y-3">
          <p>Refunds may be considered only under the following conditions:</p>
          <ul className="space-y-2">
            {[
              "Service has not been initiated",
              "Proven major error or failure from our side",
              "Duplicate or excess payment made",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-sm font-medium shadow-sm"
              >
                <i className="fas fa-check text-blue-500" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm italic text-gray-500">
            👉 All refund requests are subject to internal review and approval.
          </p>
        </div>
      ),
    },
    {
      title: "4. Refund Policy Window",
      icon: "fa-calendar-day",
      content: (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
              <h4 className="text-lg font-black text-blue-900">7 DAYS</h4>
              <p className="mt-1 text-xs font-bold uppercase text-blue-700">
                Standard Window
              </p>
            </div>
            <div className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-center">
              <h4 className="text-lg font-black text-indigo-900">15 DAYS</h4>
              <p className="mt-1 text-xs font-bold uppercase text-indigo-700">
                Exceptional cases
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <i className="fas fa-triangle-exclamation mt-1 text-amber-600" />
            <p className="text-sm font-medium leading-relaxed text-amber-900">
              Once platform access, consultation, or document processing has
              begun, service is considered consumed.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "5. Deduction Structure",
      icon: "fa-percent",
      content: (
        <div className="space-y-4">
          <p>If a refund is approved, the following deductions will apply:</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                label: "Admin Fee",
                val: "Up to 20%",
                desc: "Processing & office usage",
              },
              {
                label: "Work Charges",
                val: "Actuals",
                desc: "For tasks already completed",
              },
              {
                label: "Professional Fee",
                val: "Fixed",
                desc: "If consultation was provided",
              },
              {
                label: "Govt. Fees",
                val: "Non-Refundable",
                desc: "Stamp duty, filing, etc.",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-3"
              >
                <div>
                  <h5 className="mb-0.5 text-[10px] font-black uppercase text-gray-400">
                    {item.label}
                  </h5>
                  <p className="text-[10px] italic leading-tight text-gray-500">
                    {item.desc}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-black text-blue-700">
                  {item.val}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-blue-900 p-4 text-center">
            <p className="mb-1 text-xs font-black uppercase italic tracking-widest text-blue-300">
              Maximum refund possible
            </p>
            <p className="text-2xl font-black text-white">UP TO 80%</p>
            <p className="mt-1 text-[10px] font-medium italic opacity-70 text-blue-200">
              Of the service fee paid to our company
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "6. Non-Refundable Cases",
      icon: "fa-ban",
      content: (
        <div className="space-y-3">
          <p className="text-sm font-bold italic underline text-gray-900">
            No refund provided in the following situations:
          </p>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {[
              "Government rejections (MCA, GST)",
              "Delays by authorities or portals",
              "Incorrect info provided by client",
              "Failure to provide documents",
              "Change of mind after initiation",
              "Service already delivered",
              "Third-party delays (Banks, Gateways)",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-lg border border-rose-100 bg-rose-50 p-2 px-3 text-xs font-semibold text-rose-900"
              >
                <i className="fas fa-circle-xmark opacity-50" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      title: "7. Change of Service",
      icon: "fa-shuffle",
      content: (
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            • Service modification requests can be made within 7 days of payment
          </p>
          <p>• Adjustments will be made based on price difference</p>
          <p>
            • Once service execution begins, change requests may not be accepted
          </p>
        </div>
      ),
    },
    {
      title: "8. Refund Process",
      icon: "fa-arrow-rotate-left",
      content: (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <h4 className="mb-4 text-xs font-black uppercase italic tracking-tighter text-gray-400">
              How to request:
            </h4>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-1 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm">
                  <i className="fas fa-envelope" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">
                    Email
                  </p>
                  <p className="text-sm font-bold">
                    support@doorstepfilings.com
                  </p>
                </div>
              </div>
              <div className="hidden h-10 w-px self-center bg-gray-200 sm:block" />
              <div className="flex flex-1 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-sm">
                  <i className="fas fa-phone" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">
                    Contact
                  </p>
                  <p className="text-sm font-bold">+91 [Insert Number]</p>
                </div>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-center gap-2 italic">
                📌 Include Transaction details, Registered Email, and Reason
              </li>
            </ul>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <i className="fas fa-hourglass-half animate-pulse text-lg text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-black italic text-blue-900">
                Processing Time:
              </h4>
              <p className="text-xs leading-normal text-blue-700">
                7–21 working days (Varies by bank/payment gateway)
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "9. Service Credit Option (Recommended)",
      icon: "fa-wallet",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Instead of refunds, we may offer Service Credit / Wallet Balance for
            faster resolution and no deduction loss.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Faster resolution", "No deduction loss", "Flexible for future usage"].map(
              (benefit) => (
                <span
                  key={benefit}
                  className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase text-emerald-800"
                >
                  {benefit}
                </span>
              )
            )}
          </div>
        </div>
      ),
    },
    {
      title: "LEGAL DISCLAIMER",
      icon: "fa-scale-balanced",
      content: (
        <div className="pt-2 space-y-6">
          <div className="space-y-4 rounded-2xl border border-rose-100 bg-rose-50/50 p-6">
            <div className="space-y-6">
              <section>
                <h4 className="mb-2 text-xs font-black uppercase text-blue-900">
                  10. Nature of Business
                </h4>
                <p className="text-sm font-semibold italic leading-relaxed text-gray-700">
                  We are a private service provider. We are NOT a government
                  authority, department, or agency.
                </p>
              </section>
              <section>
                <h4 className="mb-2 text-xs font-black uppercase text-blue-900">
                  11. No Guarantee Clause
                </h4>
                <p className="mb-3 text-xs italic text-gray-600">
                  We do NOT guarantee: Approval of applications, Specific
                  timelines, Government processing speed, or Final outcomes.
                </p>
                <div className="space-y-1 rounded-xl bg-white/80 p-3 text-[10px] font-medium text-gray-500 shadow-sm">
                  <p>• Subject to Government rules & policies</p>
                  <p>• Subject to Legal compliance</p>
                  <p>• Subject to Accuracy of client data</p>
                </div>
              </section>
              <section>
                <h4 className="mb-2 text-xs font-black uppercase text-blue-900">
                  12. Third-Party Dependency
                </h4>
                <p className="text-xs text-gray-600">
                  Our services depend on Govt. portals, Banks, and External
                  experts (CAs, CSs). We are not liable for their delays,
                  failures, or rejections.
                </p>
              </section>
              <section>
                <h4 className="mb-2 text-xs font-black uppercase text-blue-900">
                  13. Client Responsibility
                </h4>
                <p className="text-xs font-black uppercase leading-normal tracking-tight text-gray-600">
                  Provide accurate info, submit docs on time, respond promptly,
                  comply with laws.
                </p>
              </section>
              <section>
                <h4 className="mb-2 text-xs font-black uppercase text-blue-900">
                  14. Limitation of Liability
                </h4>
                <p className="text-xs italic text-gray-600">
                  No liability for indirect damages, client errors, delays beyond
                  control, or govt. penalties.
                </p>
              </section>
              <section>
                <h4 className="mb-2 text-xs font-black uppercase text-blue-900">
                  15. Force Majeure
                </h4>
                <p className="text-xs font-bold uppercase underline decoration-blue-500 text-gray-600">
                  Not responsible for delays due to Natural disasters, Pandemics,
                  Govt. actions, or technical failures.
                </p>
              </section>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "16. Policy Updates",
      icon: "fa-rotate",
      content: (
        <div className="rounded-xl bg-gray-900 p-4 text-white shadow-xl">
          <p className="text-xs font-medium italic leading-relaxed">
            We reserve the right to update this policy at any time. Continued use
            of our services implies acceptance of the revised policy.
          </p>
        </div>
      ),
    },
  ];

  return (
    <PublicShell>
      <PolicyLayout
        title="Refund, Cancellation & Disclaimer"
        subtitle="Transparency in satisfaction, refunds, and legal liability."
        badge="Client Rights"
        lastUpdated={LAST_UPDATED}
        sections={sections}
      >
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-xl md:p-8">
          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/20 backdrop-blur-md">
                <i className="fas fa-face-smile text-xl" />
              </div>
              <h2 className="text-xl font-black italic leading-none tracking-tight md:text-2xl">
                Your satisfaction, our priority
              </h2>
            </div>
            <p className="max-w-2xl text-sm italic leading-relaxed text-emerald-50">
              While we have a structured refund policy, our first goal is always
              to deliver value. If we fail, we make it right.
            </p>
          </div>
          {/* Decorative Pattern */}
          <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-10 transition-transform duration-700 group-hover:rotate-12">
            <i className="fas fa-shield text-9xl" />
          </div>
        </div>
      </PolicyLayout>
    </PublicShell>
  );
}
