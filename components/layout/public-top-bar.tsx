"use client";

import { CONTACT } from "@/lib/constants/site";

export function PublicTopBar() {
  return (
    <div className="hidden bg-blue-900 py-2 text-white md:block">
      <div className="container mx-auto flex items-center justify-between px-4 text-sm">
        <div className="flex items-center gap-6">
          <a
            href={`tel:${CONTACT.phoneAlt.replace(/\s/g, "")}`}
            className="flex items-center gap-2 transition-colors hover:text-amber-300"
          >
            <i className="fas fa-phone text-xs" />
            <span>{CONTACT.phoneAlt}</span>
          </a>
          <a
            href={`mailto:${CONTACT.email}`}
            className="flex items-center gap-2 transition-colors hover:text-amber-300"
          >
            <i className="fas fa-envelope text-xs" />
            <span>{CONTACT.email}</span>
          </a>
        </div>
        <div className="flex items-center gap-3">
          <a href="#" className="transition-colors hover:text-amber-300" aria-label="Facebook">
            <i className="fab fa-facebook-f" />
          </a>
          <a href="#" className="transition-colors hover:text-amber-300" aria-label="Twitter">
            <i className="fab fa-twitter" />
          </a>
          <a href="#" className="transition-colors hover:text-amber-300" aria-label="LinkedIn">
            <i className="fab fa-linkedin-in" />
          </a>
        </div>
      </div>
    </div>
  );
}
