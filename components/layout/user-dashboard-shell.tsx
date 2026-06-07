"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/store/hooks";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { getDefaultRedirectPath } from "@/lib/auth/redirects";
import { useAuthStatus, useStoredToken, useStoredUser } from "@/lib/auth/hooks";
import { PageLogoLoader } from "@/components/ui/logo-loader";

const pageItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/dashboard/services", label: "My Services" },
  { path: "/dashboard/orders", label: "My Orders" },
  { path: "/dashboard/transactions", label: "Transaction History" },
  { path: "/dashboard/documents", label: "Documents" },
  { path: "/dashboard/certificates", label: "Certificates" },
  { path: "/dashboard/reports", label: "Reports" },
  { path: "/account", label: "My Profile" },
];

export function UserDashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const loading = useAppSelector((state) => state.auth.loading);
  const authStatus = useAuthStatus();
  const user = useStoredUser();
  const token = useStoredToken();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const redirectPath = getDefaultRedirectPath(user);
  const shouldRedirectToRolePanel = Boolean(
    token && user && redirectPath !== "/dashboard",
  );

  useEffect(() => {
    if (loading || authStatus === "loading") {
      return;
    }

    if (!token) {
      router.replace("/login");
      return;
    }

    if (shouldRedirectToRolePanel) {
      router.replace(redirectPath);
    }
  }, [authStatus, loading, redirectPath, router, shouldRedirectToRolePanel, token]);

  const currentPage =
    pageItems.find((item) =>
      item.path === "/dashboard" ? pathname === item.path : pathname.startsWith(item.path),
    )?.label || "Dashboard";

  if (loading || authStatus === "loading") {
    return (
      <PageLogoLoader
        className="min-h-screen bg-slate-50"
        label="Authenticating customer workspace..."
        size={64}
      />
    );
  }

  if (!token || shouldRedirectToRolePanel) {
    return null;
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-gray-50">
      <DashboardSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="min-w-0 w-full flex-1 transition-all duration-300 lg:ml-64">
        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
                type="button"
              >
                <i className="fas fa-bars text-xl" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-800">{currentPage}</h1>
                <p className="hidden text-xs text-gray-500 sm:block">
                  Manage your services and documents
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-900"
                type="button"
              >
                <i className="fas fa-bell text-lg" />
              </button>
              <Link
                href="/services"
                className="flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
              >
                <i className="fas fa-compass" />
                New Services
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
