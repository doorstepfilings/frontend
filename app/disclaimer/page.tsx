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
          <p className="font-bold text-gray-700">• We are a private service provider offering assistance in:</p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 pl-4">
            {["Business registration", "Tax compliance", "Legal & regulatory filings"].map(
              (item) => (
                <li
                  key={item}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center text-xs font-bold text-gray-700"
                >
                  o {item}
                </li>
              )
            )}
          </ul>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-black text-rose-600">
              <span className="text-lg">❗</span>
              <span>
                We are NOT a government authority, department, or agency
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-black text-rose-600">
              <span className="text-lg">❗</span>
              <span>
                We do not issue licenses, registrations, or approvals directly
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>All approvals are granted by respective government authorities such as:</p>
            <ul className="space-y-1 pl-4">
              <li>• MCA</li>
              <li>• GST Department</li>
              <li>• Income Tax Department</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "3. No Professional Advice",
      icon: "fa-user-tie",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-700 font-bold">All content on this website:</p>
          <ul className="space-y-2 pl-4 text-sm text-gray-700">
            <li>• Is for general informational purposes only</li>
            <li>• Does NOT constitute legal, financial, or professional advice</li>
          </ul>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black italic text-amber-900 flex items-start gap-2">
              <span className="text-lg">👉</span>
              <span>Users are advised to consult qualified professionals (CA, CS,
              Advocate) before making decisions.</span>
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
          <p className="text-sm font-bold uppercase tracking-widest text-rose-600">
            We do NOT guarantee:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              "Approval of applications",
              "Registration success",
              "Processing timelines",
              "Accuracy of government systems",
              "Final results of any service",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 text-xs font-medium text-gray-600"
              >
                <span className="font-bold text-gray-400">•</span>
                {item}
              </div>
            ))}
          </div>
          <p className="text-sm font-bold text-gray-700 mt-2">All outcomes depend on:</p>
          <ul className="space-y-1 text-sm text-gray-600 pl-4">
            <li>• Government policies</li>
            <li>• Legal scrutiny</li>
            <li>• Accuracy of documents submitted</li>
          </ul>
        </div>
      ),
    },
    {
      title: "5. Use of Website & Risk",
      icon: "fa-triangle-exclamation",
      content: (
        <div className="space-y-4">
          <ul className="space-y-2 text-sm text-gray-800 font-medium pl-4">
            <li>• You use this website and services at your own risk</li>
            <li>• The platform is provided on an “as-is” and “as-available” basis</li>
          </ul>
          <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-bold text-gray-800">
              We do not warrant that:
            </p>
            <ul className="space-y-2 text-sm font-medium text-gray-700 pl-4">
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">•</span> The website will be uninterrupted or error-free
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">•</span> The platform will be free from viruses or harmful components
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">•</span> All information is always accurate or updated
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
          <ul className="space-y-2 text-sm font-medium leading-relaxed text-gray-700 pl-4">
            <li>• All content on this website (text, graphics, logo, design, software) is owned by Doorstep Filings or its licensors</li>
            <li>• Protected under applicable copyright and trademark laws</li>
          </ul>
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
            <p className="mb-2 text-sm font-black uppercase text-rose-900 flex items-center gap-2">
              <span className="text-lg">❌</span> You may NOT:
            </p>
            <ul className="space-y-2 text-sm text-rose-800 pl-4 font-medium">
              <li>• Copy, reproduce, republish, or distribute content</li>
              <li>• Modify or create derivative works</li>
              <li>• Use content for commercial purposes without written permission</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "7. User Submissions",
      icon: "fa-hand-holding-heart",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-700 font-bold">By submitting any information, feedback, or content to us:</p>
          <ul className="space-y-2 text-sm italic leading-relaxed text-gray-600 pl-4">
            <li>• You grant us a non-exclusive, royalty-free, worldwide license to use, reproduce, and display such content</li>
            <li>• We may use such inputs to improve our services</li>
          </ul>
        </div>
      ),
    },
    {
      title: "8. Third-Party Links & Services",
      icon: "fa-link",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Our platform may contain links to third-party websites or services.
          </p>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-2">
            <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <span className="text-lg">⚠️</span> We:
            </p>
            <ul className="space-y-1 text-sm text-amber-800 pl-4 font-medium">
              <li>• Do NOT control or endorse such websites</li>
              <li>• Are NOT responsible for their content, policies, or practices</li>
            </ul>
            <p className="text-xs font-bold uppercase tracking-tighter text-amber-900 mt-2">
              Use of third-party platforms is at your own risk.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "9. Third-Party Dependencies",
      icon: "fa-diagram-project",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 font-bold">
            Our services depend on external entities such as:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 pl-4">
            <li>• Government portals (MCA, GST, Income Tax)</li>
            <li>• Banks and payment gateways</li>
            <li>• External professionals (CA, CS, legal advisors)</li>
          </ul>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="font-bold text-blue-900 flex items-center gap-2 mb-2 text-sm">
              <span className="text-lg">👉</span> We are not responsible for:
            </p>
            <ul className="space-y-1 text-sm text-blue-800 pl-4 font-medium">
              <li>• Delays</li>
              <li>• Rejections</li>
              <li>• Technical failures</li>
              <li>• Service interruptions caused by these entities</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "10. Limitation of Liability",
      icon: "fa-shield",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 font-medium">To the maximum extent permitted by law:</p>
          <p className="text-sm font-black uppercase text-gray-700">
            Doorstep Filings shall NOT be liable for:
          </p>
          <ul className="grid grid-cols-1 gap-2 text-sm font-medium text-gray-600 md:grid-cols-2">
            {[
              "Any indirect, incidental, or consequential damages",
              "Loss of profits, revenue, or data",
              "Business interruption",
              "Delays or failures beyond our control",
              "Errors due to incorrect client information",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="font-bold text-gray-400">•</span> {item}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      title: "11. Indemnification",
      icon: "fa-shield-halved",
      content: (
        <div className="space-y-4">
          <p className="text-sm font-bold text-gray-900">You agree to:</p>
          <ul className="text-sm text-gray-700 pl-4">
            <li>• Indemnify and hold harmless Doorstep Filings, its directors, employees, partners, and affiliates</li>
          </ul>
          <p className="text-sm font-bold text-gray-900">Against any claims, losses, damages, or legal expenses arising from:</p>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <ul className="space-y-2 text-sm font-medium text-gray-800 pl-4">
              <li>• Your misuse of the platform</li>
              <li>• Violation of applicable laws</li>
              <li>• Breach of this policy</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "12. Termination of Use",
      icon: "fa-user-slash",
      content: (
        <div className="space-y-4">
          <p className="text-sm font-bold text-gray-900">We reserve the right to:</p>
          <ul className="space-y-2 text-sm text-gray-700 pl-4">
            <li>• Suspend or terminate access to our platform</li>
            <li>• Refuse service</li>
          </ul>
          <p className="text-sm font-bold text-gray-900">At our discretion, without prior notice, if:</p>
          <ul className="space-y-2 text-sm text-gray-700 pl-4">
            <li>• Terms are violated</li>
            <li>• Misuse or fraudulent activity is detected</li>
          </ul>
        </div>
      ),
    },
    {
      title: "13. Governing Law & Jurisdiction",
      icon: "fa-gavel",
      content: (
        <div className="space-y-3">
          <ul className="space-y-2 text-sm font-medium text-gray-700 pl-4">
            <li>• This policy is governed by the laws of India</li>
            <li>• Any disputes shall be subject to the jurisdiction of courts in:</li>
          </ul>
          <p className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 font-black uppercase tracking-tight text-blue-700">
            <span className="text-lg">👉</span> Ahmedabad, Gujarat
          </p>
        </div>
      ),
    },
    {
      title: "14. Time Limitation for Claims",
      icon: "fa-hourglass-end",
      content: (
        <div className="group relative overflow-hidden rounded-2xl bg-rose-600 p-6 text-center text-white shadow-xl">
          <p className="relative z-10 text-xs font-bold uppercase tracking-widest opacity-90 mb-2">
            Any claim or dispute must be raised within:
          </p>
          <h4 className="mb-2 relative z-10 text-3xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-2">
            <span>👉</span> 1 MONTH
          </h4>
          <p className="relative z-10 text-xs font-black uppercase opacity-90">
            From the date of occurrence
          </p>
          <p className="mt-4 relative z-10 text-[10px] font-medium opacity-80">
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
        <div className="space-y-4">
          <p className="text-sm font-bold text-gray-800">We are not responsible for delays or failure due to:</p>
          <ul className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase text-gray-500 sm:grid-cols-3">
            {[
              "Natural disasters", 
              "Government actions", 
              "Technical failures", 
              "War, strikes, pandemics",
              "Events beyond reasonable control"
            ].map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2 text-left leading-tight"
              >
                <span className="text-gray-400">•</span> {f}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      title: "16. Updates to Disclaimer",
      icon: "fa-rotate",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">We may update this Disclaimer Policy at any time.</p>
          <p className="text-sm text-gray-700">Changes will be effective immediately upon posting.</p>
          <p className="text-sm italic text-gray-600 font-medium">
            Continued use of the platform constitutes acceptance of updated terms.
          </p>
        </div>
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
