"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <PublicShell>
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-xl w-full text-center">
          <div className="relative mb-12">
            <div className="absolute inset-0 flex items-center justify-center animate-pulse">
              <div className="w-64 h-64 bg-rose-500/10 rounded-full blur-3xl"></div>
            </div>
            <div className="relative flex justify-center">
              <div className="h-24 w-24 rounded-3xl bg-rose-600 flex items-center justify-center text-white shadow-2xl shadow-rose-600/30">
                <i className="fas fa-exclamation-triangle text-4xl"></i>
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
            System Synchronization Interrupted
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed mb-10">
            We encountered a technical anomaly while processing your request. Our systems have logged this event for administrative review.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto h-14 px-8 bg-blue-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl shadow-blue-900/20"
            >
              Re-synchronize Session
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto h-14 px-8 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all flex items-center justify-center"
            >
              Back to Terminal
            </Link>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Diagnostic Metadata
            </p>
            <div className="bg-slate-900 rounded-xl p-4 text-left overflow-x-auto max-h-40">
               <code className="text-[10px] font-mono text-rose-400 leading-relaxed">
                 {error.message || "Unknown Application Fault"}
                 {error.digest && <div className="mt-2 text-slate-500">Fault Digest: {error.digest}</div>}
               </code>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
