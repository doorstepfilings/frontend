import React, { ElementType } from "react";
import Link from "next/link";
import { StatusFeatureCard } from "@/components/ui/StatusFeatureCard";
import { Building2, FileText, Headset, ShieldCheck } from "lucide-react";

export interface ErrorPageLayoutProps {
  title: string;
  description: string;
  Icon: ElementType;
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  iconColorClass?: string;
  iconBgClass?: string;
}

export function ErrorPageLayout({
  title,
  description,
  Icon,
  primaryAction = { label: "Go to Home", href: "/" },
  secondaryAction = { label: "Contact Support", href: "/contact" },
  iconColorClass = "text-blue-600",
  iconBgClass = "bg-blue-50",
}: ErrorPageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      {/* Main Error/Status Card */}
      <div className="w-full max-w-2xl bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-8 sm:p-12 text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none" />
        
        <div className={`mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl ${iconBgClass} ${iconColorClass} shadow-inner`}>
          <Icon size={48} strokeWidth={1.5} />
        </div>
        
        <h1 className="mb-4 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          {title}
        </h1>
        
        <p className="mx-auto max-w-md text-base sm:text-lg text-slate-500 leading-relaxed mb-10 font-medium">
          {description}
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {primaryAction && (
            <Link
              href={primaryAction.href}
              className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-8 rounded-2xl bg-blue-600 text-white font-bold tracking-wide hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              {primaryAction.label}
            </Link>
          )}
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-8 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-bold tracking-wide hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      </div>

      {/* Service Highlights */}
      <div className="w-full max-w-5xl mt-16">
        <h2 className="text-center text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">
          Explore Our Services
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatusFeatureCard
            title="GST Registration"
            description="Fast & hassle-free GST registration for your business."
            Icon={FileText}
          />
          <StatusFeatureCard
            title="Company Registration"
            description="End-to-end incorporation services for startups."
            Icon={Building2}
          />
          <StatusFeatureCard
            title="Compliance Services"
            description="Stay compliant with our expert legal team."
            Icon={ShieldCheck}
          />
          <StatusFeatureCard
            title="Expert Support"
            description="24/7 priority support from chartered accountants."
            Icon={Headset}
          />
        </div>
      </div>
    </div>
  );
}
