"use client";

import { useEffect } from "react";
import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { RefreshCw, ServerCrash } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorPageLayout
      eyebrow="Something did not load"
      title="We could not open this page."
      description="This is usually temporary. Try again, go back to the home page, or contact support if you were in the middle of an application or payment."
      Icon={ServerCrash}
      imageSrc="/404.png"
      iconColorClass="text-red-600"
      iconBgClass="bg-red-50"
      primaryAction={undefined}
      secondaryAction={{
        label: "Go to Home",
        href: "/",
      }}
      extraActions={
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-blue-900 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:bg-blue-800"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try Again
        </button>
      }
    />
  );
}