"use client";

import React, { useEffect } from "react";
import { PolicyLayout } from "@/components/layout/policy-layout";
import { PublicShell } from "@/components/layout/public-shell";
import { CONTACT } from "@/lib/constants/site";

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
            At <strong className="font-semibold text-gray-900">Doorstep Filings (“Company”, “We”, “Our”)</strong>, we strive to deliver
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
                <li>• Eligible for <strong className="font-semibold">full or partial refund</strong> (after applicable deductions)</li>
              </ul>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
              <div className="mb-2 flex items-center gap-2 font-bold text-rose-800">
                <i className="fas fa-circle-xmark" />
                <h4>After Service Initiation</h4>
              </div>
              <p className="font-medium text-sm text-rose-900">
                Cancellation is <strong className="font-semibold">not allowed</strong> once the service has begun.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <h4 className="mb-3 text-xs font-black uppercase italic tracking-widest text-gray-500 underline">
              ⚠️ Service is considered “Initiated” when:
            </h4>
            <ul className="grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <i className="fas fa-file-invoice text-[10px] text-gray-400" />{" "}
                Documents are received and reviewed
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-comments text-[10px] text-gray-400" />{" "}
                Consultation or advisory has been provided
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-gavel text-[10px] text-gray-400" /> Application/process is filed with any authority
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-microchip text-[10px] text-gray-400" />{" "}
                Backend processing or documentation work has started
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
            <li className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-sm font-medium shadow-sm">
              <i className="fas fa-check text-blue-500" />
              Service has <strong className="font-semibold text-gray-900 ml-1">not been initiated</strong>
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-sm font-medium shadow-sm">
              <i className="fas fa-check text-blue-500" />
              There is a <strong className="font-semibold text-gray-900 mx-1">proven major error, deficiency, or failure</strong> from our side
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-sm font-medium shadow-sm">
              <i className="fas fa-check text-blue-500" />
              Duplicate or excess payment has been made
            </li>
          </ul>
          <p className="mt-2 text-sm italic text-gray-500">
            👉 All refund requests are subject to <strong className="font-semibold text-gray-700">internal review and approval</strong>.
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
                Refund requests must be raised within 7 days of payment
              </p>
            </div>
            <div className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-center">
              <h4 className="text-lg font-black text-indigo-900">UP TO 15 DAYS</h4>
              <p className="mt-1 text-xs font-bold uppercase text-indigo-700">
                In exceptional cases, may be considered at our discretion
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <i className="fas fa-triangle-exclamation mt-1 text-amber-600" />
            <p className="text-sm font-medium leading-relaxed text-amber-900">
              Once platform access, consultation, or document processing has
              begun, service is considered <strong className="font-bold">consumed</strong>.
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
                desc: "Processing & administrative fee",
              },
              {
                label: "Work Charges",
                val: "Actuals",
                desc: "Charges for work already completed",
              },
              {
                label: "Professional Fee",
                val: "Fixed",
                desc: "If consultation/advisory provided",
              },
              {
                label: "Govt. Fees",
                val: "Non-Refundable",
                desc: "Government fees, stamp duty, or filing charges",
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
              Maximum refund
            </p>
            <p className="text-2xl font-black text-white">UP TO 80%</p>
            <p className="mt-1 text-[10px] font-medium italic opacity-70 text-blue-200">
              Of the service fee
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
            No refund will be provided in the following situations:
          </p>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {[
              "Government rejection of application (e.g., MCA, GST, Trademark, etc.)",
              "Delays caused by government authorities or portals",
              "Incorrect, incomplete, or misleading information provided by the client",
              "Failure to provide required documents or response",
              "Change of mind after service initiation",
              "Service already substantially delivered",
              "Third-party delays (banks, payment gateways, professionals)",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-lg border border-rose-100 bg-rose-50 p-2 px-3 text-xs font-semibold text-rose-900"
              >
                <i className="fas fa-circle-xmark mt-0.5 opacity-50" />
                <span>{item}</span>
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
            • Service modification requests can be made within <strong className="font-semibold text-gray-900">7 days of payment</strong>
          </p>
          <p>• Adjustments will be made based on <strong className="font-semibold text-gray-900">price difference</strong></p>
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
              To request a refund:
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
                  <p className="text-sm font-bold">{CONTACT.phoneAlt}</p>
                </div>
              </div>
            </div>
            <p className="mb-2 text-xs font-bold text-gray-500">Include:</p>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <i className="fas fa-file-invoice text-[10px] text-gray-400" /> Transaction details
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-at text-[10px] text-gray-400" /> Registered email ID
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-question-circle text-[10px] text-gray-400" /> Reason for refund request
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <i className="fas fa-hourglass-half animate-pulse text-lg text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-black italic text-blue-900">
                Processing Time:
              </h4>
              <p className="text-xs leading-normal text-blue-700">
                Refunds are processed within <strong className="font-bold">7–21 working days</strong><br/>
                Time may vary depending on <strong className="font-bold">bank/payment gateway</strong>
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
            Instead of refunds, we may offer:
          </p>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
             <p className="font-bold text-emerald-800 text-sm mb-2 flex items-center gap-2">
               👉 Service Credit / Wallet Balance
             </p>
             <p className="text-xs font-bold text-emerald-900/60 uppercase mb-2">Benefits:</p>
             <ul className="space-y-2">
               <li className="flex items-center gap-2 text-sm text-emerald-900">
                 <i className="fas fa-check text-emerald-500" /> Faster resolution
               </li>
               <li className="flex items-center gap-2 text-sm text-emerald-900">
                 <i className="fas fa-check text-emerald-500" /> No deduction loss
               </li>
               <li className="flex items-center gap-2 text-sm text-emerald-900">
                 <i className="fas fa-check text-emerald-500" /> Flexible usage for future services
               </li>
             </ul>
          </div>
        </div>
      ),
    },
    {
      title: "LEGAL DISCLAIMER (STRONG PROTECTION)",
      icon: "fa-scale-balanced",
      content: (
        <div className="pt-2 space-y-6">
          <div className="space-y-4 rounded-2xl border border-rose-100 bg-rose-50/50 p-6">
            <div className="space-y-6">
              <section>
                <h4 className="mb-2 text-xs font-black uppercase text-blue-900">
                  10. Nature of Business
                </h4>
                <ul className="space-y-1 text-sm font-medium text-gray-700">
                  <li>• We are a <strong className="font-bold">private service provider</strong></li>
                  <li>• We are <strong className="font-bold">NOT a government authority, department, or agency</strong></li>
                </ul>
              </section>
              <section>
                <h4 className="mb-2 text-xs font-black uppercase text-blue-900">
                  11. No Guarantee Clause
                </h4>
                <p className="mb-2 text-xs font-bold text-gray-700">
                  We do NOT guarantee:
                </p>
                <ul className="mb-3 grid grid-cols-1 gap-1 text-xs text-gray-600 sm:grid-cols-2">
                  <li>• Approval of applications</li>
                  <li>• Specific timelines</li>
                  <li>• Government processing speed</li>
                  <li>• Final outcomes</li>
                </ul>
                <p className="mb-2 text-xs font-bold text-gray-700">
                  All services are subject to:
                </p>
                <ul className="grid grid-cols-1 gap-1 text-xs text-gray-600 sm:grid-cols-2">
                  <li>• Government rules & policies</li>
                  <li>• Legal compliance</li>
                  <li>• Accuracy of client-provided data</li>
                </ul>
              </section>
              <section>
                <h4 className="mb-2 text-xs font-black uppercase text-blue-900">
                  12. Third-Party Dependency
                </h4>
                <p className="mb-2 text-xs font-bold text-gray-700">
                  Our services depend on:
                </p>
                <ul className="mb-3 grid grid-cols-1 gap-1 text-xs text-gray-600">
                  <li>• Government portals (MCA, GST, Income Tax, etc.)</li>
                  <li>• Banks & payment gateways</li>
                  <li>• External professionals (CA, CS, legal experts)</li>
                </ul>
                <p className="text-xs font-bold text-rose-700 bg-rose-100 p-2 rounded-lg">
                  ⚠️ We are <strong className="font-black">not liable</strong> for delays, failures, or rejections caused by these entities.
                </p>
              </section>
              <section>
                <h4 className="mb-2 text-xs font-black uppercase text-blue-900">
                  13. Client Responsibility
                </h4>
                <p className="mb-2 text-xs font-bold text-gray-700">
                  Users agree to:
                </p>
                <ul className="grid grid-cols-1 gap-1 text-xs text-gray-600 sm:grid-cols-2">
                  <li>• Provide accurate and complete information</li>
                  <li>• Submit documents on time</li>
                  <li>• Respond promptly to queries</li>
                  <li>• Comply with applicable laws and regulations</li>
                </ul>
              </section>
              <section>
                <h4 className="mb-2 text-xs font-black uppercase text-blue-900">
                  14. Limitation of Liability
                </h4>
                <p className="mb-2 text-xs font-bold text-gray-700">
                  Doorstep Filings shall <strong className="font-black">not be liable</strong> for:
                </p>
                <ul className="grid grid-cols-1 gap-1 text-xs text-gray-600">
                  <li>• Any indirect, incidental, or consequential damages</li>
                  <li>• Losses due to incorrect or incomplete client information</li>
                  <li>• Delays beyond our control</li>
                  <li>• Government penalties, fines, or legal consequences</li>
                </ul>
              </section>
              <section>
                <h4 className="mb-2 text-xs font-black uppercase text-blue-900">
                  15. Force Majeure
                </h4>
                <p className="mb-2 text-xs font-bold text-gray-700">
                  We shall not be held responsible for delays or failure due to:
                </p>
                <ul className="grid grid-cols-2 gap-1 text-xs text-gray-600 sm:grid-cols-3">
                  <li>• Natural disasters</li>
                  <li>• Pandemics</li>
                  <li>• Government actions</li>
                  <li>• Technical failures</li>
                  <li className="col-span-2 sm:col-span-1">• War, strikes, or unforeseen events</li>
                </ul>
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
        <div className="rounded-xl bg-gray-900 p-4 text-white shadow-xl space-y-2">
          <p className="text-sm font-medium">
            We reserve the right to update this policy at any time.
          </p>
          <p className="text-sm text-gray-300">
            Changes will be reflected with an updated date.
          </p>
          <p className="text-sm font-medium italic text-gray-400">
            Continued use of our services implies acceptance of the revised policy.
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
