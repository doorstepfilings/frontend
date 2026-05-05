"use client";

import React, { useEffect } from "react";
import { PolicyLayout } from "@/components/layout/policy-layout";
import { PublicShell } from "@/components/layout/public-shell";

const LAST_UPDATED = "04 April 2026";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      title: "1. Introduction",
      icon: "fa-circle-info",
      content: (
        <div className="space-y-4">
          <p>
            At Doorstep Filings (“Company”, “We”, “Our”, “Us”), we are committed
            to protecting your privacy and ensuring transparency in how your
            personal data is collected, used, stored, and shared.
          </p>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-2 text-sm font-semibold italic text-blue-900">
              This Privacy Policy applies to:
            </p>
            <ul className="space-y-1 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <i className="fas fa-globe text-xs" />
                <span>Our website: doorstepfilings.com / doorstepfilings.in</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-mobile-screen text-xs" />
                <span>Mobile applications (if any)</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-briefcase text-xs" />
                <span>All services offered by Doorstep Filings</span>
              </li>
            </ul>
          </div>
          <p className="text-sm font-medium text-gray-600">
            By accessing or using our platform, you agree to this Privacy Policy.
          </p>
        </div>
      ),
    },
    {
      title: "2. Information We Collect",
      icon: "fa-database",
      content: (
        <div className="space-y-6">
          <p>
            We collect information to provide efficient, compliant, and secure
            services.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <h4 className="mb-2 flex items-center gap-2 font-bold text-gray-900">
                <i className="fas fa-id-card text-xs text-blue-500" />
                Personal Identification
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Full Name, Email Address</li>
                <li>• Mobile Number</li>
                <li>• Date of Birth (where required)</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <h4 className="mb-2 flex items-center gap-2 font-bold text-gray-900">
                <i className="fas fa-building text-xs text-blue-500" />
                KYC & Business Info
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• PAN Card, Aadhaar Card</li>
                <li>• GSTIN, CIN, LLPIN</li>
                <li>• Residential & business address</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <h4 className="mb-2 flex items-center gap-2 font-bold text-gray-900">
                <i className="fas fa-credit-card text-xs text-blue-500" />
                Financial Information
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Billing details, Transaction history</li>
                <li className="font-medium text-rose-600">
                  ⚠️ No complete card storage
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <h4 className="mb-2 flex items-center gap-2 font-bold text-gray-900">
                <i className="fas fa-microchip text-xs text-blue-500" />
                Technical & Usage
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• IP address, Browser type</li>
                <li>• Login & activity logs</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "3. How We Use Your Information",
      icon: "fa-gears",
      content: (
        <div className="space-y-4">
          <p>We use your data for the following lawful purposes:</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              "Service delivery (GST, filing, etc.)",
              "Identity verification (KYC)",
              "Legal & regulatory compliance",
              "Customer support resolution",
              "Transaction processing",
              "Service updates & alerts",
              "Improving platform performance",
              "Fraud detection & risk management",
              "Marketing (with consent)",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <i className="fas fa-check-circle text-emerald-500" />
                <span className="text-sm font-medium text-gray-700">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "4. Cookies & Tracking Technologies",
      icon: "fa-cookie-bite",
      content: (
        <div className="space-y-3">
          <p>
            We use cookies and similar technologies to enhance user experience
            and analyze traffic patterns.
          </p>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">
              You can disable cookies in your browser settings; however, some
              features may not function properly.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "5. Data Sharing & Disclosure",
      icon: "fa-share-nodes",
      content: (
        <div className="space-y-4">
          <p className="font-bold uppercase tracking-tight text-rose-600">
            We do NOT sell your personal data.
          </p>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-black uppercase text-gray-900">
                A. Legal Disclosures
              </h4>
              <p className="text-sm text-gray-600">
                Government authorities (MCA, GST, IT), Law enforcement, Regulatory
                bodies.
              </p>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-black uppercase text-gray-900">
                B. Professional Partners
              </h4>
              <p className="text-sm text-gray-600">
                CAs, CSs, and Legal advisors engaged for service delivery.
              </p>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-black uppercase text-gray-900">
                C. Third-Party Providers
              </h4>
              <p className="text-sm text-gray-600">
                Payment gateways, Cloud hosting, CRM & IT service providers.
              </p>
            </div>
          </div>
          <p className="rounded-lg bg-blue-50 p-3 text-center text-xs font-bold text-blue-700">
            All third parties are bound by strict confidentiality obligations.
          </p>
        </div>
      ),
    },
    {
      title: "6. Business Transfers",
      icon: "fa-right-left",
      content: (
        <div className="space-y-3">
          <p>
            In case of merger, acquisition, or sale of assets, your data may be
            transferred. We will ensure:
          </p>
          <ul className="space-y-2 list-none">
            <li className="flex items-center gap-3 text-sm">
              <i className="fas fa-lock text-blue-500" />
              Continued confidentiality
            </li>
            <li className="flex items-center gap-3 text-sm">
              <i className="fas fa-bell text-blue-500" />
              Prior notification (where required)
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "7. Data Security",
      icon: "fa-shield-halved",
      content: (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { title: "End-to-end Encryption", icon: "fa-key" },
            { title: "Secure Cloud Infrastructure", icon: "fa-server" },
            { title: "Role-based Access", icon: "fa-user-lock" },
            { title: "Regular Audits", icon: "fa-magnifying-glass" },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3"
            >
              <i className={`fas ${item.icon} text-blue-600`} />
              <span className="text-xs font-bold text-blue-900">
                {item.title}
              </span>
            </div>
          ))}
          <p className="col-span-full mt-2 text-xs italic text-gray-500">
            ⚠️ While we strive for complete security, no system is 100% secure.
          </p>
        </div>
      ),
    },
    {
      title: "8. Data Retention",
      icon: "fa-clock-rotate-left",
      content: (
        <div className="space-y-3 text-sm text-gray-600">
          <p>We retain your data:</p>
          <ul className="space-y-1 pl-5 list-disc">
            <li>As required under laws (Income Tax, GST, Companies Act)</li>
            <li>Until completion of services</li>
            <li>For audit, legal, and dispute resolution purposes</li>
          </ul>
        </div>
      ),
    },
    {
      title: "9. Your Rights",
      icon: "fa-user-check",
      content: (
        <div className="space-y-4">
          <ul className="grid grid-cols-1 gap-2">
            {[
              "Access your personal data",
              "Request correction or updates",
              "Request deletion (subject to laws)",
              "Withdraw marketing consent",
              "Request data portability",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-sm text-emerald-900"
              >
                <i className="fas fa-check text-xs" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm font-medium text-gray-700">
            📩 Contact us at:{" "}
            <span className="text-blue-600 underline">
              support@doorstepfilings.com
            </span>
          </p>
        </div>
      ),
    },
    {
      title: "10. Third-Party Links",
      icon: "fa-link",
      content: (
        <p className="text-sm leading-relaxed text-gray-600">
          Our platform may contain links to external sites. We are not
          responsible for their privacy practices. Review their policies
          separately.
        </p>
      ),
    },
    {
      title: "11. Children’s Privacy",
      icon: "fa-child-reaching",
      content: (
        <p className="text-sm text-gray-600">
          Our services are not intended for individuals under 18. We do not
          knowingly collect data from minors.
        </p>
      ),
    },
    {
      title: "12. Advertising & Analytics",
      icon: "fa-chart-line",
      content: (
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            We use third-party tools such as Google Analytics and Google Ads.
          </p>
          <p>
            These may use cookies to serve relevant ads based on user behavior.
            Opt out via browser settings.
          </p>
        </div>
      ),
    },
    {
      title: "13. Marketing & Communication",
      icon: "fa-bullhorn",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            By providing details, you consent to receive Emails, Calls, and
            SMS/WhatsApp communications.
          </p>
          <div className="flex gap-4">
            <i className="fab fa-whatsapp text-xl text-emerald-500" />
            <i className="fas fa-envelope text-xl text-rose-500" />
            <i className="fas fa-phone text-xl text-blue-500" />
          </div>
        </div>
      ),
    },
    {
      title: "14. Updates to This Policy",
      icon: "fa-rotate",
      content: (
        <p className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
          We may update this policy periodically. Continued use constitutes
          acceptance of updated terms.
        </p>
      ),
    },
    {
      title: "15. Contact & Grievance",
      icon: "fa-address-card",
      content: (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-blue-900 p-6 text-white shadow-lg">
            <div className="relative z-10 space-y-4">
              <div>
                <h4 className="mb-1 text-xs font-black uppercase text-blue-300">
                  Doorstep Filings
                </h4>
                <p className="text-sm">Ahmedabad, Gujarat, India</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-blue-300">
                    Email
                  </h4>
                  <p className="text-sm font-medium">
                    support@doorstepfilings.com
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-blue-300">
                    Phone
                  </h4>
                  <p className="text-sm font-medium">+91 90000 00000</p>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4">
                <h4 className="mb-2 text-xs font-black uppercase text-blue-300">
                  Grievance Officer
                </h4>
                <p className="text-sm font-bold">Privacy Officer</p>
                <p className="text-xs opacity-80">
                  privacy@doorstepfilings.com
                </p>
              </div>
            </div>
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <PublicShell>
      <PolicyLayout
        title="Privacy Policy"
        subtitle="Advanced & Compliant data protection protocols for your business peace of mind."
        badge="Data Security"
        lastUpdated={LAST_UPDATED}
        sections={sections}
      >
        <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <div className="relative z-10 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-900 transition-colors duration-500 group-hover:bg-blue-600 group-hover:text-white">
              <i className="fas fa-shield-halved text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-gray-900 md:text-xl">
                Your trust is our asset
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 md:text-base">
                We use your data strictly to deliver services and meet regulatory
                compliance. Privacy isn&apos;t just a policy; it&apos;s a promise.
              </p>
            </div>
          </div>
        </div>
      </PolicyLayout>
    </PublicShell>
  );
}
