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
        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
                aria-label="Open sidebar"
              >
                <i className="fas fa-bars text-xl" />
              </button>
              <div>
                <h1 className="text-lg font-black tracking-tight text-gray-900 lg:text-xl">
                  <Link href={activeItem?.path ?? navItems[0]?.path ?? "/admin/dashboard"} className="transition-colors hover:text-blue-900">
                    {activeItem?.label ?? "Dashboard"}
                  </Link>
                </h1>
                <p className="hidden text-[10px] font-bold uppercase tracking-widest text-gray-400 sm:block">
                  {portalMeta.sectionLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <p className="text-xs font-black uppercase tracking-tight text-gray-900">
                  {user?.name ?? "Active User"}
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {portalMeta.headerLabel}
                </p>
              </div>
              {portalMeta.actionHref && portalMeta.actionLabel ? (
                <Link
                  href={portalMeta.actionHref}
                  className="admin-btn text-xs normal-case tracking-normal font-medium"
                >
                  <i className="fas fa-plus" />
                  <span>{portalMeta.actionLabel}</span>
                </Link>
              ) : (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
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
