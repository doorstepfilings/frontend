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
    <div className="admin-theme flex min-h-screen overflow-x-hidden bg-gray-50">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="w-full flex-1 transition-all duration-300 lg:ml-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 py-4 lg:px-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
                aria-label="Open sidebar"
              >
                <i className="fas fa-bars" />
              </button>
              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-900">
                  {activeItem?.label ?? "Management Hub"}
                </h1>
                <p className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:block mt-0.5">
                  {portalMeta.sectionLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden text-right md:block">
                <p className="text-xs font-bold text-slate-900 tracking-tight">
                  {user?.name ?? "Portal User"}
                </p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  {portalMeta.headerLabel}
                </p>
              </div>
              
              {portalMeta.actionHref && portalMeta.actionLabel ? (
                <Link
                  href={portalMeta.actionHref}
                  className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wide flex items-center gap-2 shadow-sm"
                >
                  <i className="fas fa-plus text-[10px]" />
                  <span>{portalMeta.actionLabel}</span>
                </Link>
              ) : (
                <div className="h-10 px-5 flex items-center justify-center rounded-xl bg-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {portalMeta.roleTag}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
