"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hooks";
import { logout } from "@/lib/features/auth/auth-slice";
import { useStoredUser } from "@/lib/auth/hooks";

type DashboardSidebarProps = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
};

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "fa-th-large" },
  { path: "/dashboard/services", label: "My Services", icon: "fa-clipboard-list" },
  { path: "/dashboard/orders", label: "My Orders", icon: "fa-shopping-bag" },
  { path: "/dashboard/transactions", label: "Transaction History", icon: "fa-history" },
  { path: "/dashboard/documents", label: "Documents", icon: "fa-folder-open" },
  { path: "/dashboard/certificates", label: "Certificates", icon: "fa-award" },
  { path: "/dashboard/reports", label: "Reports", icon: "fa-file-alt" },
];

const bookkeepingItems = [
  {
    path: "/dashboard/bookkeeping/business-profile",
    label: "Business Profile",
    icon: "fa-building",
  },
  {
    path: "/dashboard/bookkeeping/customers",
    label: "Customers",
    icon: "fa-users",
  },
  {
    path: "/dashboard/bookkeeping/quotations",
    label: "Quotations",
    icon: "fa-briefcase",
  },
  {
    path: "/dashboard/bookkeeping/proforma-invoices",
    label: "Proforma Invoices",
    icon: "fa-life-ring",
  },
  {
    path: "/dashboard/bookkeeping/invoices",
    label: "Invoices",
    icon: "fa-file-invoice",
  },
  {
    path: "/dashboard/bookkeeping/delivery-challans",
    label: "Delivery Challans",
    icon: "fa-truck-loading",
  },
  {
    path: "/dashboard/bookkeeping/billing",
    label: "Billing",
    icon: "fa-receipt",
  },
];

export default function DashboardSidebar({
  isOpen,
  setIsOpen,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useStoredUser();
  const isBookkeepingActive = pathname.startsWith("/dashboard/bookkeeping");
  const [isBookkeepingOpen, setIsBookkeepingOpen] = useState(isBookkeepingActive);

  const handleLogout = async () => {
    await dispatch(logout()).unwrap();
    router.push("/login");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === path;
    }

    return pathname.startsWith(path);
  };

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed h-full w-64 transform overflow-y-hidden border-r border-gray-100 bg-white transition-all duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } z-50 flex flex-col`}
      >
        {/* Scrollable Container */}
        <div className="flex flex-1 flex-col overflow-y-auto min-h-0">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/assets/images/logo.png"
                alt="Doorstep Filings"
                width={160}
                height={80}
                className="h-20 w-auto object-contain"
              />
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 lg:hidden"
              type="button"
            >
              <i className="fas fa-times text-xl" />
            </button>
          </div>

          <div className="p-4 flex-1">
            <div className="mb-6 rounded-2xl bg-blue-900 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-blue-200">Client Account</p>
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    isActive(item.path)
                      ? "bg-blue-50 font-semibold text-blue-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-blue-900"
                  }`}
                >
                  <i className={`fas ${item.icon} w-5 text-center`} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}

              <div className="pt-5">
                <button
                  type="button"
                  onClick={() => setIsBookkeepingOpen((current) => !current)}
                  aria-expanded={isBookkeepingOpen}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    isBookkeepingActive
                      ? "bg-blue-50 font-semibold text-blue-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-blue-900"
                  }`}
                >
                  <i className="fas fa-book w-5 text-center" />
                  <span className="flex-1 text-left text-sm">Bookkeeping</span>
                  <i
                    className={`fas fa-chevron-down text-[10px] transition-transform ${
                      isBookkeepingOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isBookkeepingOpen ? (
                  <div className="mt-1 space-y-1 pl-4">
                    {bookkeepingItems.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all ${
                          isActive(item.path)
                            ? "bg-blue-50 font-semibold text-blue-900"
                            : "text-gray-600 hover:bg-gray-50 hover:text-blue-900"
                        }`}
                      >
                        <i className={`fas ${item.icon} w-5 text-center text-xs`} />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </nav>

            <div className="mt-8 border-t border-gray-100 pt-6">
              <Link
                href="/account"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-gray-600 transition-colors hover:bg-gray-50"
              >
                <i className="fas fa-user-circle w-5 text-center" />
                <span className="text-sm">My Profile</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Container */}
        <div className="shrink-0 p-4 border-t border-gray-100 bg-white space-y-3">
          <button
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-600 transition-colors hover:bg-red-50"
            type="button"
          >
            <i className="fas fa-sign-out-alt w-5 text-center" />
            <span className="text-sm font-medium">Logout</span>
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-3 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100"
          >
            <i className="fas fa-home text-xs" /> Back to Website
          </Link>
        </div>
      </aside>
    </>
  );
}
