"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { normalizeRole } from "@/lib/auth/redirects";
import { useStoredUser } from "@/lib/auth/hooks";
import {
  getActiveDashboardItem,
  getDashboardNavItems,
  getRolePortalMeta,
} from "./role-navigation";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = useStoredUser();
  const inferredRole = pathname.startsWith("/rm")
    ? "regional_manager"
    : pathname.startsWith("/accountant")
      ? "accountant"
      : pathname.startsWith("/admin")
        ? "super_admin"
        : null;
  const normalizedRole = normalizeRole(
    typeof user?.role === "string" ? user.role : inferredRole,
  );
  const navItems = getDashboardNavItems(normalizedRole);
  const activeItem = getActiveDashboardItem(pathname, navItems);
  const portalMeta = getRolePortalMeta(normalizedRole);

  return (
    <div className="admin-theme flex min-h-screen overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="min-w-0 w-full flex-1 transition-all duration-300 lg:ml-[17rem]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/88 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5 lg:px-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 lg:hidden"
                aria-label="Open sidebar"
              >
                <i className="fas fa-bars" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                  {portalMeta.sectionLabel}
                </p>
                <h1 className="truncate text-base font-black tracking-tight text-slate-900 sm:text-lg">
                  {activeItem?.label ?? "Management Hub"}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3 sm:gap-6">
              {portalMeta.actionHref && portalMeta.actionLabel ? (
                <Link
                  href={portalMeta.actionHref}
                  className="admin-btn h-10 rounded-2xl px-3 text-[10px] tracking-[0.14em] sm:px-5"
                >
                  <i className="fas fa-plus text-[10px]" />
                  <span className="hidden sm:inline">
                    {portalMeta.actionLabel}
                  </span>
                </Link>
              ) : (
                <div className="panel-chip px-3 sm:px-4">
                  {portalMeta.roleTag}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 px-3 py-4 sm:px-4 lg:px-8 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
