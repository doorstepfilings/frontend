import React, { ReactNode } from "react";
import Link from "next/link";
import { SITE } from "@/lib/constants/site";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footerLink?: { to: string; label: string };
  maxWidthClass?: string;
}

export function AuthShell({
  title,
  subtitle,
  children,
  footerLink = { to: "/login", label: "Back to Login" },
  maxWidthClass = "max-w-md",
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      {/* Background accents */}
      <div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_55%)]" />

      <div className={`relative w-full ${maxWidthClass}`}>
        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
          <div className="p-8 md:p-10">
            <div className="mb-6 flex items-center justify-center">
              <img
                src="/assets/images/logo.png"
                alt={SITE.name}
                className="h-16 w-auto object-contain"
              />
            </div>

            <div className="mb-8 text-center">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                {title}
              </h1>
              {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
            </div>

            {children}

            {footerLink?.to && (
              <div className="mt-8 text-center">
                <Link
                  href={footerLink.to}
                  className="font-bold text-blue-900 hover:underline"
                >
                  {footerLink.label}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
