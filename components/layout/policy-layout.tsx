"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CONTACT } from "@/lib/constants/site";

const slugify = (value: string) =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

interface Section {
  title: string;
  anchor?: string;
  icon?: string;
  hint?: string;
  content: React.ReactNode;
}

interface PolicyLayoutProps {
  title: string;
  subtitle?: string;
  badge?: string;
  lastUpdated?: string;
  breadcrumbs?: { label: string; href?: string }[];
  sections?: Section[];
  children?: React.ReactNode;
}

export function PolicyLayout({
  title,
  subtitle,
  badge = "Legal",
  lastUpdated,
  breadcrumbs,
  sections = [],
  children,
}: PolicyLayoutProps) {
  const normalizedSections = useMemo(() => {
    return (Array.isArray(sections) ? sections : []).map((section, index) => {
      const safeTitle = section?.title || `Section ${index + 1}`;
      return {
        ...section,
        _index: index + 1,
        _anchor: section?.anchor || slugify(safeTitle) || `section-${index + 1}`,
        _title: safeTitle,
      };
    });
  }, [sections]);

  const breadcrumbItems = breadcrumbs || [
    { label: "Home", href: "/" },
    { label: title },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />

      {/* Hero */}
      <div className="relative overflow-hidden bg-blue-900 py-14 text-white md:py-18">
        <div className="absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 -translate-x-1/2 translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
            <i className="fas fa-scale-balanced" />
            <span>{badge}</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-3xl text-base font-medium leading-relaxed text-blue-200 md:text-lg">
              {subtitle}
            </p>
          )}
          {lastUpdated && (
            <p className="mt-4 text-sm text-blue-300/80">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
      </div>

      <section className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Mobile TOC */}
          {normalizedSections.length > 0 && (
            <div className="lg:hidden">
              <details className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                <summary className="flex cursor-pointer select-none items-center justify-between px-5 py-4">
                  <span className="text-sm font-bold text-gray-900">
                    On this page
                  </span>
                  <i className="fas fa-chevron-down text-gray-400" />
                </summary>
                <div className="px-5 pb-5">
                  <div className="space-y-2">
                    {normalizedSections.map((section) => (
                      <a
                        key={section._anchor}
                        href={`#${section._anchor}`}
                        className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50"
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-black text-blue-900">
                          {section._index}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">
                          {section._title}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </details>
            </div>
          )}

          {/* Desktop TOC */}
          {normalizedSections.length > 0 && (
            <aside className="hidden lg:col-span-4 lg:block">
              <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="mb-4 text-xs font-black uppercase tracking-widest text-gray-400">
                  On this page
                </p>
                <nav className="space-y-2">
                  {normalizedSections.map((section) => (
                    <a
                      key={section._anchor}
                      href={`#${section._anchor}`}
                      className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50"
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-black text-blue-900 transition-colors group-hover:bg-blue-900 group-hover:text-white">
                        {section._index < 10
                          ? `0${section._index}`
                          : section._index}
                      </span>
                      <span className="text-sm font-semibold text-gray-700 transition-colors group-hover:text-blue-900">
                        {section._title}
                      </span>
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          <div
            className={`${
              normalizedSections.length > 0 ? "lg:col-span-8" : "lg:col-span-12"
            } space-y-6`}
          >
            {children}

            {normalizedSections.map((section) => (
              <div
                key={section._anchor}
                id={section._anchor}
                className="scroll-mt-24 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-sm font-black text-white">
                      {section._index}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-base font-black tracking-tight text-gray-900 md:text-lg">
                        {section._title}
                      </h2>
                      {section?.hint && (
                        <p className="mt-1 text-sm text-gray-500">
                          {section.hint}
                        </p>
                      )}
                    </div>
                  </div>
                  {section?.icon && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
                      <i className={`fas ${section.icon}`} />
                    </div>
                  )}
                </div>

                <div className="p-6 md:p-8">
                  <div className="space-y-4 text-sm leading-relaxed text-gray-700 md:text-base">
                    {section?.content}
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-gray-400">
                    Need help?
                  </p>
                  <h3 className="text-lg font-black text-gray-900">
                    Contact Doorstep Filings
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Email us at{" "}
                    <a
                      href={`mailto:${CONTACT.email}`}
                      className="font-bold text-blue-900 hover:underline"
                    >
                      {CONTACT.email}
                    </a>{" "}
                    or visit our{" "}
                    <Link
                      href="/contact"
                      className="font-bold text-blue-900 hover:underline"
                    >
                      Contact page
                    </Link>
                    .
                  </p>
                </div>
                <div className="flex gap-3">
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-3 font-bold text-white transition-colors hover:bg-blue-800"
                  >
                    <i className="fas fa-envelope" />
                    Email
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-bold text-white transition-colors hover:bg-amber-600"
                  >
                    <i className="fas fa-headset" />
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
