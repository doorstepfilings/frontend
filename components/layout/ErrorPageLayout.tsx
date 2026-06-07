import React, { ElementType, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CreditCard,
  FileText,
  Headset,
  Home,
  LogIn,
  Phone,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { CONTACT } from "@/lib/constants/site";

export interface ErrorPageLayoutProps {
  title: string;
  description: string;
  Icon?: ElementType;
  eyebrow?: string;
  imageSrc?: string;
  primaryAction?: {
    label: string;
    href: string;
    icon?: ElementType;
  };
  secondaryAction?: {
    label: string;
    href: string;
    icon?: ElementType;
  };
  extraActions?: ReactNode;
  iconColorClass?: string;
  iconBgClass?: string;
}

export function ErrorPageLayout({
  title,
  description,
  Icon = AlertTriangle,
  eyebrow = "Oops! Something went wrong",
  imageSrc = "/404.png",
  primaryAction = { label: "Go to Homepage", href: "/" },
  secondaryAction = { label: "Contact Support", href: "/contact" },
  extraActions,
  iconColorClass = "text-orange-600",
  iconBgClass = "bg-orange-50",
}: ErrorPageLayoutProps) {
  const PrimaryIcon = primaryAction.icon ?? getActionIcon(primaryAction);
  const SecondaryIcon = secondaryAction.icon ?? getActionIcon(secondaryAction);
  const primaryIcon = React.createElement(PrimaryIcon, {
    "aria-hidden": "true",
    className: "h-5 w-5",
  });
  const secondaryIcon = React.createElement(SecondaryIcon, {
    "aria-hidden": "true",
    className: "h-5 w-5",
  });

  return (
    <main className="bg-white">
      <section className="relative overflow-hidden px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="pointer-events-none absolute left-0 top-20 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-orange-100/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
            <div>
              <div
                className={`mb-8 inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-black ${iconBgClass} ${iconColorClass}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {eyebrow}
              </div>

              <h1 className="max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {title}
              </h1>

              <p className="mt-6 max-w-xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                {description}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {extraActions}

                {primaryAction ? (
                  <Link
                    href={primaryAction.href}
                    className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-blue-900 px-6 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:bg-blue-800"
                  >
                    {primaryIcon}
                    {primaryAction.label}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : null}

                {secondaryAction ? (
                  <Link
                    href={secondaryAction.href}
                    className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border border-blue-200 bg-white px-6 text-sm font-black text-blue-900 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-50"
                  >
                    {secondaryIcon}
                    {secondaryAction.label}
                  </Link>
                ) : null}
              </div>

              <div className="mt-9 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:max-w-md">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Phone className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-black text-slate-950">
                    Need immediate help?
                  </p>
                  <a
                    href={`tel:${CONTACT.phoneAlt.replace(/\s/g, "")}`}
                    className="text-sm font-bold text-blue-700 hover:text-blue-900"
                  >
                    Call us at {CONTACT.phoneAlt}
                  </a>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
                <Image
                  src={imageSrc}
                  alt="404 illustration"
                  width={900}
                  height={700}
                  className="mx-auto h-auto w-full max-w-2xl object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="mt-14">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Quickly find what you need
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <QuickLinkCard
                title="Browse Services"
                description="Explore our services and find the right solution for you."
                href="/services"
                Icon={BriefcaseBusiness}
                iconClassName="bg-blue-50 text-blue-700"
              />

              <QuickLinkCard
                title="GST & Tax Filing"
                description="Continue with GST, ITR, compliance, and business filing."
                href="/services"
                Icon={FileText}
                iconClassName="bg-green-50 text-green-700"
              />

              <QuickLinkCard
                title="Start a Business"
                description="Get help with company registration and documentation."
                href="/services"
                Icon={Building2}
                iconClassName="bg-orange-50 text-orange-700"
              />

              <QuickLinkCard
                title="Contact Support"
                description="Our team is here to help you with the next step."
                href="/contact"
                Icon={Headset}
                iconClassName="bg-violet-50 text-violet-700"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function QuickLinkCard({
  title,
  description,
  href,
  Icon,
  iconClassName,
}: {
  title: string;
  description: string;
  href: string;
  Icon: ElementType;
  iconClassName: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60"
    >
      <span
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${iconClassName}`}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>

      <h3 className="text-base font-black text-slate-950">{title}</h3>

      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
        {description}
      </p>

      <span className="mt-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-blue-900 transition-all group-hover:border-blue-700 group-hover:bg-blue-700 group-hover:text-white">
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

function getActionIcon(action: { label: string; href: string }) {
  const label = action.label.toLowerCase();

  if (action.href === "/") return Home;
  if (action.href.includes("login") || label.includes("login")) return LogIn;
  if (action.href.includes("payment") || label.includes("payment")) {
    return CreditCard;
  }
  if (action.href.includes("service") || label.includes("service")) {
    return BriefcaseBusiness;
  }
  if (label.includes("try")) return RefreshCw;
  if (action.href.includes("contact") || label.includes("support")) {
    return Headset;
  }

  return ArrowRight;
}
