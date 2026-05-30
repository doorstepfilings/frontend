"use client";

import React, { useEffect } from "react";
import { PolicyLayout } from "@/components/layout/policy-layout";
import { PublicShell } from "@/components/layout/public-shell";

const LAST_UPDATED = "04 April 2026";

export default function ConfidentialityPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      title: "1. Our Commitment to Confidentiality",
      icon: "fa-handshake",
      content: (
        <div className="space-y-4">
          <p>
            At Doorstep Filings (“Company”, “We”, “Our”, “Us”), we place the
            highest importance on:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>Client data protection</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>Information confidentiality</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                Secure handling of sensitive business and personal information
              </span>
            </li>
          </ul>
          <p className="italic text-gray-600">
            We are committed to maintaining strict confidentiality and
            implementing robust information security practices across all our
            operations.
          </p>
        </div>
      ),
    },
    {
      title: "2. Non-Disclosure Commitment",
      icon: "fa-ban",
      content: (
        <div className="space-y-4">
          <p>We strictly adhere to the following principles:</p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4">
              <i className="fas fa-circle-xmark mt-1 text-rose-600" />
              <span className="font-medium text-rose-900">
                We do NOT sell, rent, or trade client data
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4">
              <i className="fas fa-circle-xmark mt-1 text-rose-600" />
              <span className="font-medium text-rose-900">
                We do NOT disclose client information to third parties without consent
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <i className="fas fa-circle-check mt-1 text-emerald-600" />
              <span className="font-medium text-emerald-900">
                Your data is used strictly for service delivery and compliance purposes.
              </span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "3. Definition of Confidential Information",
      icon: "fa-file-shield",
      content: (
        <div className="space-y-4">
          <p>“Confidential Information” includes, but is not limited to:</p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              "Personal data (KYC, identity documents)",
              "Business information (GST, CIN, financials, structure)",
              "Proprietary ideas, business models, and strategies",
              "Trade secrets, research, and technical data",
              "Financial records, projections, and pricing",
              "Client lists, vendor details, and marketing plans",
              "Any information disclosed verbally, digitally, or in writing",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
              >
                <span className="text-sm text-blue-600 font-bold">•</span>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="flex items-start gap-2 font-semibold text-blue-900">
              <span className="text-lg">👉</span>
              <span>Whether or not marked as “confidential”, such information will be
                treated as confidential.</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "4. Purpose of Use",
      icon: "fa-bullseye",
      content: (
        <div className="space-y-4">
          <p>Confidential Information shall be used only for:</p>
          <ul className="space-y-2 pl-5 list-disc">
            <li>Providing requested services</li>
            <li>Legal and regulatory compliance</li>
            <li>Internal processing and verification</li>
          </ul>
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
            <p className="mb-2 font-bold text-rose-900">
              ❗ It will NOT be used for:
            </p>
            <ul className="space-y-1 text-rose-800">
              <li>• Unauthorized commercial exploitation</li>
              <li>• Personal benefit</li>
              <li>• Competitive advantage</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "5. Restricted Access & Internal Control",
      icon: "fa-user-lock",
      content: (
        <div className="space-y-4">
          <p>Access to confidential data is strictly limited to:</p>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: "Authorized employees", icon: "fa-user-tie" },
                { label: "Directors, partners, and officers", icon: "fa-users-gear" },
                {
                  label: "Verified professionals (CA, CS)",
                  icon: "fa-user-check",
                },
                { label: "Trusted contractors (under confidentiality obligations)", icon: "fa-handshake" },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <span className="text-blue-500 font-bold">•</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-gray-200 pt-4 text-sm font-semibold text-blue-700 flex items-center gap-2">
              <span>👉</span> Access is granted strictly on a “need-to-know” basis.
            </p>
          </div>
          <p className="text-gray-600">
            All personnel are bound by:
          </p>
          <ul className="list-disc pl-5 text-gray-600">
            <li>Confidentiality obligations</li>
            <li>Data protection policies</li>
          </ul>
        </div>
      ),
    },
    {
      title: "6. Permitted Disclosures",
      icon: "fa-eye",
      content: (
        <div className="space-y-4">
          <p>
            We may disclose confidential information only in the following cases:
          </p>
          <div className="space-y-3">
            {[
              "With explicit client consent",
              "When required by law, regulation, or court order",
              "To government authorities (MCA, GST, Income Tax, etc.)",
              "To authorized professionals for service delivery",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <i className="fas fa-check text-emerald-500" />
                <span className="font-medium text-gray-800">{item}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <span className="text-amber-600">⚠️</span>
            <p className="text-sm font-medium text-amber-900">
              All such disclosures are made under strict confidentiality
              safeguards.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "7. Exceptions to Confidentiality",
      icon: "fa-gavel",
      content: (
        <div className="space-y-3">
          <p>
            Confidentiality obligations shall NOT apply to information that:
          </p>
          <ul className="space-y-2 list-none">
            {[
              "Was already in our possession prior to disclosure",
              "Is publicly available without breach of this agreement",
              "Is received from a third party without confidentiality obligations",
              "Is independently developed without reference to client data",
              "Is disclosed with client’s written consent",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-gray-600">
                <span className="text-blue-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      title: "8. Data Security Measures",
      icon: "fa-lock",
      content: (
        <div className="space-y-4">
          <p>We implement industry-standard security practices:</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <span className="text-xl">🔐</span>
              <span className="text-sm font-medium">Data encryption (storage & transmission)</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <span className="text-xl">🖥</span>
              <span className="text-sm font-medium">Secure servers & cloud infrastructure</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <span className="text-xl">🔑</span>
              <span className="text-sm font-medium">Role-based access control</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <span className="text-xl">🔍</span>
              <span className="text-sm font-medium">Continuous monitoring & audits</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "9. Client Responsibility",
      icon: "fa-user-check",
      content: (
        <div className="space-y-4">
          <p>Clients agree to:</p>
          <ul className="space-y-2">
            <li>• Provide accurate and lawful information</li>
            <li>• Avoid sharing sensitive data through insecure channels</li>
            <li>• Maintain confidentiality of their own login credentials</li>
          </ul>
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <span className="text-amber-600 font-bold">⚠️</span>
            <p className="text-sm font-medium text-amber-900">
              We are not responsible for breaches caused due to user negligence.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "10. Intellectual Property Protection",
      icon: "fa-copyright",
      content: (
        <div className="space-y-3">
          <p>
            All confidential information remains the exclusive property of the
            client.
          </p>
          <p className="font-semibold text-gray-700">
            Nothing in this agreement grants:
          </p>
          <ul className="space-y-1 pl-5 list-disc">
            <li>Ownership rights</li>
            <li>License to use client IP beyond service delivery</li>
          </ul>
        </div>
      ),
    },
    {
      title: "11. Indemnity Clause",
      icon: "fa-shield",
      content: (
        <div className="space-y-3">
          <p>
            You agree to indemnify and hold harmless Doorstep Filings against:
          </p>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="mb-2 font-medium text-gray-900">
              Any losses, damages, or claims arising from:
            </p>
            <ul className="space-y-2 border-l-2 border-blue-200 pl-4 text-sm font-medium">
              <li>o Unauthorized use of the platform</li>
              <li>o Breach of confidentiality by your actions</li>
              <li>o Submission of unlawful or misleading data</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "12. Limitation of Liability",
      icon: "fa-scale-balanced",
      content: (
        <div className="space-y-3">
          <p>Doorstep Filings shall NOT be liable for:</p>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {[
              "Indirect or consequential damages",
              "Loss of business, profits, or data",
              "Breaches caused by third-party systems or government portals",
              "Events beyond reasonable control",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 px-3 text-sm text-gray-600"
              >
                <span className="font-bold text-gray-400">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      title: "13. Duration of Confidentiality",
      icon: "fa-clock-rotate-left",
      content: (
        <div className="space-y-3">
          <p>Confidentiality obligations continue:</p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
              <p className="font-bold text-blue-900">o During service engagement</p>
            </div>
            <div className="flex-1 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
              <p className="font-bold text-emerald-900">o Even after termination of services</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "14. Governing Law & Jurisdiction",
      icon: "fa-landmark",
      content: (
        <div className="space-y-3">
          <p>This agreement is governed by the laws of India.</p>
          <p className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <span className="font-bold text-blue-600">👉</span>
            <span>
              Any disputes shall be subject to jurisdiction of:{" "}
              <strong>Ahmedabad, Gujarat</strong>
            </span>
          </p>
        </div>
      ),
    },
    {
      title: "15. Severability",
      icon: "fa-puzzle-piece",
      content: (
        <div className="space-y-3">
          <p>If any provision of this agreement is found unenforceable:</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-3">
              <span className="text-emerald-500 font-bold">•</span>
              <span>
                The remaining provisions shall continue in full force
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-blue-500 font-bold">•</span>
              <span>
                The invalid clause shall be modified to the minimum extent
                required
              </span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "16. Updates to Policy",
      icon: "fa-rotate",
      content: (
        <div className="space-y-4">
          <p>
            We may update this Confidentiality Policy from time to time.
          </p>
          <p className="rounded-xl bg-blue-900 p-4 text-sm font-medium text-white">
            Continued use of our platform constitutes acceptance of the updated
            policy.
          </p>
        </div>
      ),
    },
  ];

  return (
    <PublicShell>
      <PolicyLayout
        title="Confidentiality Policy & Agreement"
        subtitle="Our commitment to protecting your business secrets and personal data."
        badge="Privacy & Trust"
        lastUpdated={LAST_UPDATED}
        sections={sections}
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 p-6 text-white shadow-xl md:p-8">
          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                <i className="fas fa-shield-halved text-xl" />
              </div>
              <h2 className="text-xl font-black tracking-tight md:text-2xl">
                Trust is our foundation
              </h2>
            </div>
            <p className="max-w-2xl leading-relaxed text-blue-100">
              At Doorstep Filings, we treat your business data as if it were our
              own. Our confidentiality commitment is legally binding and ingrained
              in every process.
            </p>
          </div>
          {/* Decorative blob */}
          <div className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-blue-400 opacity-10 blur-3xl" />
        </div>
      </PolicyLayout>
    </PublicShell>
  );
}
