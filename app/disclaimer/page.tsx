"use client";

import React, { useEffect } from "react";
import { PolicyLayout } from "@/components/layout/policy-layout";
import { PublicShell } from "@/components/layout/public-shell";

const LAST_UPDATED = "04 April 2026";

export default function DisclaimerPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      title: "1. Acceptance of Terms",
      icon: "fa-file-contract",
      content: (
        <div className="space-y-4">
          <p>
            This website (doorstepfilings.in) is owned and operated by Doorstep
            Filings (“Company”, “We”, “Our”, “Us”).
          </p>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">
              By accessing or using our website, platform, or services, you agree
              to be bound by this Disclaimer Policy along with our Terms &
              Conditions and Privacy Policy.
            </p>
          </div>
          <p className="text-sm font-bold text-rose-600">
            If you do not agree, you should not use our platform.
          </p>
        </div>
      ),
    },
    {
      title: "2. Nature of Services",
      icon: "fa-building-columns",
      content: (
        <div className="space-y-4">
          <p>We are a private service provider offering assistance in:</p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {["Business registration", "Tax compliance", "Legal & regulatory filings"].map(
              (item) => (
                <li
                  key={item}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center text-xs font-bold text-gray-700"
                >
                  {item}
                </li>
              )
            )}
          </ul>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-black text-rose-600">
              <i className="fas fa-circle-exclamation shrink-0" />
              <span>
                We are NOT a government authority, department, or agency.
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-black text-rose-600">
              <i className="fas fa-circle-exclamation shrink-0" />
              <span>
                We do not issue licenses, registrations, or approvals directly.
              </span>
            </div>
          </div>
          <p className="text-xs italic text-gray-500">
            All approvals are granted by respective government authorities such as
            MCA, GST Department, and Income Tax Department.
          </p>
        </div>
      ),
    },
    {
      title: "3. No Professional Advice",
      icon: "fa-user-tie",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            All content on this website is for general informational purposes only
            and does NOT constitute legal, financial, or professional advice.
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black italic text-amber-900">
              👉 Users are advised to consult qualified professionals (CA, CS,
              Advocate) before making decisions.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "4. No Guarantee of Outcomes",
      icon: "fa-ban",
      content: (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-rose-600">
            We do NOT guarantee:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              "Approval of applications",
              "Registration success",
              "Processing timelines",
              "Accuracy of govt systems",
              "Final results of any service",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 text-xs font-medium text-gray-600"
              >
                <i className="fas fa-minus text-[8px] text-gray-400" />
                {item}
              </div>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-gray-500">
            All outcomes depend on Government policies, Legal scrutiny, and the
            Accuracy of documents submitted.
          </p>
        </div>
      ),
    },
    {
      title: "5. Use of Website & Risk",
      icon: "fa-triangle-exclamation",
      content: (
        <div className="space-y-4">
          <p className="text-sm font-bold uppercase text-gray-900">
            You use this website and services at your own risk.
          </p>
          <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs italic text-gray-600">
              The platform is provided on an “as-is” and “as-available” basis. We
              do not warrant that:
            </p>
            <ul className="space-y-1 text-xs font-medium text-gray-700">
              <li className="flex items-center gap-2">
                <i className="fas fa-circle text-[4px] text-blue-500" /> The
                website will be uninterrupted
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-circle text-[4px] text-blue-500" /> The
                platform will be virus-free
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-circle text-[4px] text-blue-500" /> All
                information is always accurate
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "6. Intellectual Property Rights",
      icon: "fa-copyright",
      content: (
        <div className="space-y-4">
          <p className="text-sm font-medium leading-relaxed text-gray-700">
            All content on this website (text, graphics, logo, design, software)
            is owned by Doorstep Filings.
          </p>
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
            <p className="mb-2 text-xs font-black uppercase text-rose-900">
              ❌ Prohibited Actions:
            </p>
            <ul className="space-y-1 text-xs text-rose-800">
              <li>• Copy, reproduce, or distribute content</li>
              <li>• Modify or create derivative works</li>
              <li>• Use for commercial purposes without permission</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "7. User Submissions",
      icon: "fa-hand-holding-heart",
      content: (
        <p className="text-sm italic leading-relaxed text-gray-600">
          By submitting information, you grant us a non-exclusive license to use
          such input to improve our services.
        </p>
      ),
    },
    {
      title: "8. Third-Party Links & Services",
      icon: "fa-link",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Our platform may contain links to external sites. We do NOT control or
            endorse them.
          </p>
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
            <p className="text-xs font-bold uppercase tracking-tighter text-amber-900">
              ⚠️ Use of third-party platforms is at your own risk.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "9. Third-Party Dependencies",
      icon: "fa-diagram-project",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Our services depend on external entities (Govt. portals, Banks,
            External professionals).
          </p>
          <div className="rounded-xl bg-gray-900 p-4 text-[10px] font-black uppercase leading-loose tracking-widest text-gray-400">
            We are NOT responsible for:<br />
            <span className="text-white">
              Delays / Rejections / Technical failures / Service interruptions
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "10. Limitation of Liability",
      icon: "fa-shield",
      content: (
        <div className="space-y-3">
          <p className="text-xs font-black uppercase text-gray-500">
            Doorstep Filings shall NOT be liable for:
          </p>
          <ul className="grid grid-cols-1 gap-2 text-sm font-medium text-gray-700 md:grid-cols-2">
            <li className="flex items-center gap-2">
              Indirect or incidental damages
            </li>
            <li className="flex items-center gap-2">
              Loss of profits or data
            </li>
            <li className="flex items-center gap-2">Business interruption</li>
            <li className="flex items-center gap-2">
              Errors due to client info
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "11. Indemnification",
      icon: "fa-shield-halved",
      content: (
        <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs text-gray-600">
            You agree to hold harmless Doorstep Filings against claims arising
            from:
          </p>
          <ul className="space-y-1 text-xs font-bold italic text-gray-900">
            <li>• Your misuse of the platform</li>
            <li>• Violation of laws</li>
            <li>• Breach of this policy</li>
          </ul>
        </div>
      ),
    },
    {
      title: "12. Termination of Use",
      icon: "fa-user-slash",
      content: (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            We reserve the right to suspend access or refuse service at our
            discretion if misuse is detected.
          </p>
        </div>
      ),
    },
    {
      title: "13. Governing Law & Jurisdiction",
      icon: "fa-gavel",
      content: (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="mb-1 text-sm font-bold italic text-blue-900">
            Governed by the laws of India.
          </p>
          <p className="text-xs font-black uppercase tracking-tight text-blue-700">
            👉 Jurisdiction: Ahmedabad, Gujarat
          </p>
        </div>
      ),
    },
    {
      title: "14. Time Limitation for Claims",
      icon: "fa-hourglass-end",
      content: (
        <div className="group relative overflow-hidden rounded-2xl bg-rose-600 p-6 text-center text-white shadow-xl">
          <h4 className="mb-1 relative z-10 text-3xl font-black uppercase italic tracking-tighter">
            1 MONTH
          </h4>
          <p className="relative z-10 text-[10px] font-black uppercase italic tracking-widest opacity-80">
            Time Limit for Any Claim
          </p>
          <p className="mt-4 relative z-10 text-[10px] font-medium opacity-60">
            Failing which, the claim shall be considered waived.
          </p>
          <i className="fas fa-clock absolute -bottom-4 -right-4 rotate-12 text-8xl text-white/10 transition-transform duration-700 group-hover:rotate-0" />
        </div>
      ),
    },
    {
      title: "15. Force Majeure",
      icon: "fa-cloud-bolt",
      content: (
        <ul className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase text-gray-500 sm:grid-cols-4">
          {["Natural disasters", "Govt actions", "Tech failures", "War / Strikes"].map(
            (f) => (
              <li
                key={f}
                className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-center leading-tight transition-transform hover:-translate-y-1"
              >
                {f}
              </li>
            )
          )}
        </ul>
      ),
    },
    {
      title: "16. Updates to Disclaimer",
      icon: "fa-rotate",
      content: (
        <p className="text-sm italic text-gray-600">
          Effective immediately upon posting. Continued use implies acceptance.
        </p>
      ),
    },
  ];

  return (
    <PublicShell>
      <PolicyLayout
        title="Disclaimer Policy"
        subtitle="Understand the legal scope, nature of services, and limitations of liability."
        badge="Legal Disclaimer"
        lastUpdated={LAST_UPDATED}
        sections={sections}
      >
        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-gray-900 to-slate-950 p-6 text-white shadow-2xl md:p-8">
          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                <i className="fas fa-scale-balanced text-xl" />
              </div>
              <h2 className="text-xl font-black italic leading-none tracking-tight md:text-2xl">
                Clear legal boundaries
              </h2>
            </div>
            <p className="max-w-2xl text-sm italic leading-relaxed text-gray-400">
              By using Doorstep Filings, you acknowledge the nature of our business
              as a private facilitator and accept the risks associated with
              third‑party dependencies.
            </p>
          </div>
          {/* Decorative Pattern */}
          <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-5 transition-transform duration-1000 group-hover:scale-110">
            <i className="fas fa-gavel text-[240px]" />
          </div>
        </div>
      </PolicyLayout>
    </PublicShell>
  );
}
