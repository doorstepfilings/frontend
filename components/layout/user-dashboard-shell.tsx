"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/store/hooks";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { getDefaultRedirectPath } from "@/lib/auth/redirects";
import {
  useAuthStatus,
  useSessionExpiryRedirecting,
  useStoredToken,
  useStoredUser,
} from "@/lib/auth/hooks";
import { GlobalLogoLoader } from "@/components/ui/logo-loader";

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
  const isSessionExpiryRedirecting = useSessionExpiryRedirecting();
  const user = useStoredUser();
  const token = useStoredToken();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const redirectPath = getDefaultRedirectPath(user);
  const shouldRedirectToRolePanel = Boolean(
    token && user && redirectPath !== "/dashboard",
  );

  useEffect(() => {
    if (
      loading ||
      authStatus === "loading" ||
      isSessionExpiryRedirecting
    ) {
      return;
    }

    if (!token) {
      router.replace("/");
      return;
    }

    if (shouldRedirectToRolePanel) {
      router.replace(redirectPath);
    }
  }, [
    authStatus,
    isSessionExpiryRedirecting,
    loading,
    redirectPath,
    router,
    shouldRedirectToRolePanel,
    token,
  ]);

  const currentPage =
    pageItems.find((item) =>
      item.path === "/dashboard" ? pathname === item.path : pathname.startsWith(item.path),
    )?.label || "Dashboard";

  if (loading || authStatus === "loading" || isSessionExpiryRedirecting) {
    return (
      <GlobalLogoLoader label="Checking your session..." size={64} />
    );
  }

  if (!token || shouldRedirectToRolePanel) {
    return <GlobalLogoLoader label="Redirecting securely..." size={64} />;
  }

  return (
    <div className="flex min-h-screen overflow-x-clip bg-gray-50">
      <DashboardSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="min-w-0 w-full flex-1 transition-all duration-300 lg:ml-64">
        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between gap-3 px-3 py-4 sm:px-4 lg:px-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
                type="button"
              >
                <i className="fas fa-bars text-xl" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-gray-800">{currentPage}</h1>
                <p className="hidden text-xs text-gray-500 sm:block">
                  Manage your services and documents
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-900"
                type="button"
                title="Notifications"
                aria-label="Notifications"
              >
                <i className="fas fa-bell text-base sm:text-lg" />
              </button>
              <Link
                href="/services"
                className="flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-lg bg-blue-900 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-800"
                title="Explore and Apply for New Services"
              >
                <i className="fas fa-plus text-xs sm:text-sm" />
                <span>
                  <span className="inline sm:hidden">Services</span>
                  <span className="hidden sm:inline">Explore Services</span>
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="min-w-0 p-3 sm:p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
