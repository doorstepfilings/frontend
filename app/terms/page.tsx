"use client";

import React, { useEffect } from "react";
import { PolicyLayout } from "@/components/layout/policy-layout";
import { PublicShell } from "@/components/layout/public-shell";

const LAST_UPDATED = "04 April 2026";

export default function TermsAndConditionsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      title: "1. Introduction",
      icon: "fa-box-archive",
      content: (
        <div className="space-y-4">
          <p>Welcome to Doorstep Filings (“Company”, “we”, “our”, “us”).</p>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">
              These Terms & Conditions (“Agreement”) govern your use of our
              website, mobile platform, and offline services, including doorstep
              assistance.
            </p>
          </div>
          <p className="text-sm font-medium italic text-gray-600">
            By accessing or using our services, you agree to be legally bound by
            this Agreement.
          </p>
        </div>
      ),
    },
    {
      title: "2. Nature of Platform",
      icon: "fa-network-wired",
      content: (
        <div className="space-y-4">
          <p>
            Doorstep Filings is a hybrid business services platform combining:
          </p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                label: "Technology",
                desc: "Website & App",
                icon: "fa-laptop-code",
              },
              {
                label: "Human Expertise",
                desc: "Consultants & RMs",
                icon: "fa-user-tie",
              },
              {
                label: "Physical Execution",
                desc: "Doorstep Services",
                icon: "fa-car",
              },
            ].map((item) => (
              <li
                key={item.label}
                className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center"
              >
                <i className={`fas ${item.icon} mb-2 text-blue-500`} />
                <h5 className="text-[10px] font-black uppercase text-gray-900">
                  {item.label}
                </h5>
                <p className="mt-0.5 text-[10px] italic text-gray-500">
                  {item.desc}
                </p>
              </li>
            ))}
          </ul>
          <p className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-center text-xs font-bold text-blue-800">
            We act as a service facilitator, coordinating between users,
            professionals, and government authorities.
          </p>
        </div>
      ),
    },
    {
      title: "3. Services Offered",
      icon: "fa-list-check",
      content: (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">
            We provide end-to-end solutions including:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Business Registration (LLP, Pvt Ltd, etc.)",
              "Trademark, Copyright & IP Services",
              "GST, Income Tax & Compliance",
              "Accounting & Payroll",
              "Startup Ecosystem Services",
              "Legal Documentation",
              "Doorstep Consultation & Execution",
            ].map((item) => (
              <span
                key={item}
                className="rounded-xl border border-gray-100 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-tight text-gray-700 shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "4. User Responsibilities",
      icon: "fa-user-check",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">You agree that:</p>
          <ul className="space-y-2 list-none">
            {[
              "All information provided is accurate and complete",
              "Provide required documents on time",
              "Verify final filings before submission",
              "Comply with applicable laws",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-lg bg-gray-50 p-2 text-sm text-gray-700"
              >
                <i className="fas fa-check text-xs text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
            <p className="mb-1 text-sm font-bold italic text-rose-900">
              ⚠️ Important:
            </p>
            <p className="text-[11px] font-semibold italic leading-relaxed text-rose-800">
              We rely entirely on the information provided by you. Any error,
              rejection, or penalty due to incorrect data is your responsibility.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "5. Payments, Pricing & Taxes",
      icon: "fa-credit-card",
      content: (
        <div className="space-y-4">
          <ul className="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
            <li className="flex items-center gap-2">
              • All services are chargeable
            </li>
            <li className="flex items-center gap-2">
              • Prices include professional fees
            </li>
            <li className="flex items-center gap-2">
              • Govt fees/Stamp duty are additional
            </li>
            <li className="flex items-center gap-2">
              • GST as per applicable laws
            </li>
          </ul>
          <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <i className="fas fa-receipt text-emerald-600" />
            <p className="text-xs font-bold uppercase tracking-tighter text-emerald-900">
              GST Input Credit is available only if GSTIN is provided at the time
              of payment.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "6. Refund & Cancellation Policy",
      icon: "fa-receipt",
      content: (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <h4 className="mb-2 text-xs font-black uppercase text-gray-900">
              Refund Structure
            </h4>
            <div className="rounded-lg border border-dashed border-blue-200 bg-white p-3 text-center">
              <p className="text-2xl font-black text-blue-600">UP TO 80%</p>
              <p className="mt-1 text-[10px] font-bold italic uppercase tracking-widest text-gray-400">
                Max Refund Possible
              </p>
            </div>
            <ul className="mt-3 space-y-1 text-[10px] italic text-gray-500">
              <li>• Deduction of work completed</li>
              <li>• Deduction of government fees</li>
              <li>• 20% processing fee applies</li>
            </ul>
          </div>
          <p className="text-xs font-bold uppercase italic text-rose-600">
            No refund in cases of Govt rejection, Change of mind, or Incomplete
            response.
          </p>
        </div>
      ),
    },
    {
      title: "7. Doorstep Service Terms",
      icon: "fa-car",
      content: (
        <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-bold text-blue-900">
            • Visits subject to availability & area
          </p>
          <p className="text-sm font-bold text-blue-900">
            • Scheduled time availability is mandatory
          </p>
          <p className="text-sm font-bold text-blue-900">
            • Remote locations may attract charges
          </p>
          <p className="mt-2 text-[10px] italic text-blue-700 opacity-70">
            We are not responsible for delays due to client unavailability.
          </p>
        </div>
      ),
    },
    {
      title: "8. Timelines & Delivery Disclaimer",
      icon: "fa-clock",
      content: (
        <div className="space-y-4">
          <p className="text-sm italic text-gray-600">
            Timelines are indicative and subject to Government approvals and
            third-party dependencies.
          </p>
          <div className="rounded-xl border-t-4 border-rose-500 bg-rose-50/50 p-4 shadow-sm">
            <p className="text-sm font-black uppercase tracking-tighter text-rose-900">
              🚫 No Guarantee of Approvals
            </p>
            <p className="mt-1 text-xs font-semibold italic text-rose-800">
              (e.g. Trademark registration success)
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "9. Platform Usage & Conduct",
      icon: "fa-user-lock",
      content: (
        <div className="space-y-3">
          <p className="text-xs font-black uppercase italic text-gray-400">
            Forbidden actions:
          </p>
          <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <i className="fas fa-ban text-rose-500" /> Unauthorized platform
              access
            </li>
            <li className="flex items-center gap-2">
              <i className="fas fa-ban text-rose-500" /> Reselling our services
            </li>
            <li className="flex items-center gap-2">
              <i className="fas fa-ban text-rose-500" /> Automated data
              extraction
            </li>
            <li className="flex items-center gap-2">
              <i className="fas fa-ban text-rose-500" /> Unlawful/Fraudulent
              activities
            </li>
          </div>
        </div>
      ),
    },
    {
      title: "10. Relationship Manager Model",
      icon: "fa-user-tie",
      content: (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            A dedicated Relationship Manager (RM) may be assigned as a
            facilitator, not a decision-maker.
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-xs font-black uppercase italic leading-loose tracking-widest text-amber-900">
              Final approvals and compliance responsibility remains with the
              client.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "11. Third-Party & Govt Dependency",
      icon: "fa-link",
      content: (
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            We may engage CAs, Lawyers, and use Portals like MCA, GST, IP India.
            We are NOT liable for:
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {["Third-party delays", "Portal downtime", "Govt rejections"].map(
              (i) => (
                <li
                  key={i}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-center text-[10px] font-black uppercase"
                >
                  {i}
                </li>
              )
            )}
          </ul>
        </div>
      ),
    },
    {
      title: "12. Intellectual Property",
      icon: "fa-copyright",
      content: (
        <div className="space-y-2 text-sm text-gray-700">
          <p>• Logo, design, software belongs to Doorstep Filings</p>
          <p>• Unauthorized use of platform content is prohibited</p>
          <p className="mt-2 text-xs font-bold italic text-blue-600">
            Transfer of client deliverables (logo, website) is handled per
            agreement.
          </p>
        </div>
      ),
    },
    {
      title: "13. Data & Privacy",
      icon: "fa-shield-halved",
      content: (
        <div className="space-y-2 text-sm italic leading-relaxed text-gray-600">
          Data is collected for service delivery only and may be shared with Govt
          authorities and professionals. Handled as per our Privacy Policy.
        </div>
      ),
    },
    {
      title: "14. Limitation of Liability",
      icon: "fa-shield",
      content: (
        <div className="space-y-4">
          <div className="group relative overflow-hidden rounded-2xl bg-rose-600 p-6 text-center text-white shadow-xl">
            <p className="mb-2 relative z-10 text-[10px] font-black uppercase italic tracking-widest opacity-80">
              Total Possible Liability
            </p>
            <h4 className="relative z-10 text-2xl font-black uppercase italic tracking-tighter">
              Amount paid for service
            </h4>
            <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-125" />
          </div>
          <p className="text-[10px] font-bold italic leading-normal text-gray-400">
            NOT liable for: Business losses, penalties, or indirect damages.
          </p>
        </div>
      ),
    },
    {
      title: "15. Indemnity",
      icon: "fa-shield-halved",
      content: (
        <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="mb-4 text-xs font-bold italic underline text-gray-600">
            You agree to indemnify against:
          </p>
          <ul className="grid grid-cols-1 gap-2 text-xs text-gray-900 sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <i className="fas fa-shield text-blue-500" /> Legal claims
            </li>
            <li className="flex items-center gap-2">
              <i className="fas fa-shield text-blue-500" /> Incorrect info
            </li>
            <li className="flex items-center gap-2">
              <i className="fas fa-shield text-blue-500" /> Misuse of services
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "16. Force Majeure",
      icon: "fa-cloud-bolt",
      content: (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-xs font-bold uppercase italic leading-loose tracking-widest text-indigo-900">
          Not liable for delays due to Govt changes, disasters, tech failures, or
          pandemics.
        </div>
      ),
    },
    {
      title: "17. Termination",
      icon: "fa-user-slash",
      content: (
        <div className="space-y-2 text-[11px] font-black uppercase italic tracking-tighter text-gray-500">
          Suspension occurs if: Fraud detected, Terms violated, or
          Non-cooperation.
        </div>
      ),
    },
    {
      title: "18. Governing Law",
      icon: "fa-gavel",
      content: (
        <div className="flex flex-col items-center rounded-xl bg-gray-900 p-4 text-white">
          <span className="mb-1 text-[10px] font-black uppercase italic tracking-widest text-gray-400">
            📍 Laws of India
          </span>
          <span className="text-lg font-black italic tracking-tighter">
            Ahmedabad, Gujarat
          </span>
        </div>
      ),
    },
    {
      title: "19. Updates to Terms",
      icon: "fa-rotate",
      content: (
        <div className="rounded-lg bg-blue-50 p-3 text-sm font-medium italic text-blue-800">
          Updates possible at any time. Continued use implies acceptance.
        </div>
      ),
    },
    {
      title: "20. Contact Details",
      icon: "fa-address-card",
      content: (
        <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h4 className="mb-4 text-lg font-black italic tracking-tighter text-gray-900">
            Doorstep Filings
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500">
                <i className="fas fa-location-dot" />
              </div>
              <span className="text-sm font-medium italic text-gray-600">
                Ahmedabad, Gujarat, India
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-500">
                <i className="fas fa-envelope" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                support@doorstepfilings.in
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500">
                <i className="fas fa-phone" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                +91 98791 88811
              </span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <PublicShell>
      <PolicyLayout
        title="Terms & Conditions"
        subtitle="The definitive rules for our partnership, platform usage, and service execution."
        badge="Legal Agreement"
        lastUpdated={LAST_UPDATED}
        sections={sections}
      >
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 to-blue-950 p-6 text-white shadow-2xl md:p-10">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                <i className="fas fa-scroll text-2xl" />
              </div>
              <h2 className="text-2xl font-black uppercase italic leading-none tracking-tight md:text-3xl">
                Read with care
              </h2>
            </div>
            <p className="text-sm font-medium italic leading-relaxed text-indigo-100/80 md:text-base">
              These terms establish a binding agreement. They explain how we use
              our hybrid platform of technology and human expertise to deliver
              doorstep compliance and registration.
            </p>
          </div>
          {/* Decorative Elements */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
          <i className="fas fa-file-contract absolute bottom-10 right-10 translate-y-10 -rotate-12 text-[180px] text-white/5 transition-transform duration-1000 group-hover:translate-y-0" />
        </div>
      </PolicyLayout>
    </PublicShell>
  );
}
