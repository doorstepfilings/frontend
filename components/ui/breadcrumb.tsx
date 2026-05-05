"use client";

import React from "react";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="border-b bg-white">
      <div className="container mx-auto px-4 py-3">
        <p className="text-sm text-gray-500">
          {items.map((item, i) => (
            <span key={i}>
              {i > 0 && " / "}
              {item.href ? (
                <Link href={item.href} className="transition-colors hover:text-amber-500">
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-800">{item.label}</span>
              )}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
