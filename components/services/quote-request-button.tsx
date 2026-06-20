"use client";

import type { ReactNode } from "react";
import { openContactRequest } from "@/lib/utils/contact-request";

export function QuoteRequestButton({
  serviceName,
  className,
  children,
}: {
  serviceName: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        openContactRequest({
          mode: "quote",
          service: serviceName,
          message: `I would like to request a quote for ${serviceName}.`,
        })
      }
      className={className}
    >
      {children ?? (
        <>
          <i className="fas fa-file-signature" />
          Request a Quote
        </>
      )}
    </button>
  );
}
