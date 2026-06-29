"use client";

import { useEffect, useState } from "react";

const BENEFITS = [
  "Data-Driven Financial Advice",
  "Risk Mitigation & Compliance",
  "Strategic Growth Planning",
] as const;

function ConsultationFields() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-hidden="true">
          <div>
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">
              First Name
            </span>
            <div className="h-[50px] w-full rounded border border-gray-200 bg-gray-50" />
          </div>
          <div>
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">
              Last Name
            </span>
            <div className="h-[50px] w-full rounded border border-gray-200 bg-gray-50" />
          </div>
        </div>
        <div aria-hidden="true">
          <span className="mb-1 block text-xs font-bold uppercase text-gray-500">
            Email
          </span>
          <div className="h-[50px] w-full rounded border border-gray-200 bg-gray-50" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div suppressHydrationWarning>
          <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
            First Name
          </label>
          <input
            type="text"
            autoComplete="off"
            data-form-type="other"
            data-lpignore="true"
            className="w-full rounded border border-gray-200 bg-gray-50 px-4 py-3 focus:border-blue-900 focus:outline-none"
          />
        </div>
        <div suppressHydrationWarning>
          <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
            Last Name
          </label>
          <input
            type="text"
            autoComplete="off"
            data-form-type="other"
            data-lpignore="true"
            className="w-full rounded border border-gray-200 bg-gray-50 px-4 py-3 focus:border-blue-900 focus:outline-none"
          />
        </div>
      </div>
      <div suppressHydrationWarning>
        <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
          Email
        </label>
        <input
          type="email"
          autoComplete="off"
          data-form-type="other"
          data-lpignore="true"
          className="w-full rounded border border-gray-200 bg-gray-50 px-4 py-3 focus:border-blue-900 focus:outline-none"
        />
      </div>
    </>
  );
}

export function HomeCta() {
  return (
    <section className="relative overflow-hidden bg-blue-900 py-14 text-white sm:py-20">
      <div className="absolute top-0 right-0 h-full w-1/2 origin-top-right skew-x-12 bg-white/5" />
      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col items-center gap-12 lg:flex-row">
          {/* Left copy */}
          <div className="w-full lg:w-1/2">
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">
              Partnering for Your Success
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-blue-200">
              We do not just balance books; we build businesses. Our proactive
              approach ensures you are always ahead of regulatory changes and
              market shifts.
            </p>
            <ul className="mb-8 space-y-4">
              {BENEFITS.map((item) => (
                <li key={item} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                    <i className="fas fa-check" />
                  </div>
                  <span className="text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right consultation form */}
          <div className="w-full rounded-2xl bg-white p-5 text-gray-800 shadow-2xl sm:p-8 lg:w-1/2">
            <h3 className="mb-6 text-2xl font-bold">Request a Consultation</h3>
            <form
              className="space-y-4"
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              suppressHydrationWarning
            >
              <ConsultationFields />
              <button
                type="button"
                className="w-full rounded bg-amber-500 py-4 text-lg font-bold text-white transition-colors hover:bg-amber-600"
              >
                Submit Request
              </button>
              <p className="mt-4 text-center text-xs text-gray-400">
                We respect your privacy. No spam, ever.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
