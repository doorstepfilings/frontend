"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hooks";
import { logout } from "@/lib/features/auth/auth-slice";
import { normalizeRole } from "@/lib/auth/redirects";
import { useStoredUser } from "@/lib/auth/hooks";
import {
  getDashboardNavItems,
  getRolePortalMeta,
  isDashboardPathActive,
} from "./role-navigation";

type AdminSidebarProps = {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
};

export function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
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
  const portalMeta = getRolePortalMeta(normalizedRole);

  const handleLogout = async () => {
    await dispatch(logout()).unwrap();
    router.push("/login");
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[17rem] transform flex-col overflow-y-auto border-r border-slate-200 bg-white shadow-[0_18px_44px_-28px_rgba(15,23,42,0.3)] transition-all duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
          <Link
            href={navItems[0]?.path ?? "/admin/dashboard"}
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
            onClick={() => setIsOpen(false)}
          >
            <Image
              src="/assets/images/logo.png"
              alt="DoorstepFilings"
              width={160}
              height={80}
              className="h-16 w-auto object-contain"
            />
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 transition-colors hover:text-slate-600 lg:hidden"
            aria-label="Close sidebar"
          >
            <i className="fas fa-times text-xl" />
          </button>
        </div>

        <div className="px-4 pb-3 pt-4">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="admin-btn-muted flex w-full justify-start rounded-2xl text-xs normal-case tracking-normal font-semibold"
          >
            <i className="fas fa-external-link-alt text-xs" />
            Back to Website
          </Link>
        </div>

        <div className="mx-4 mt-1 rounded-[1.35rem] border border-blue-900/10 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-4 text-white shadow-[0_20px_40px_-26px_rgba(30,58,138,0.9)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/16 text-lg font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? "D"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.name ?? "Doorstep User"}</p>
              <p className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-blue-200">{portalMeta.roleTag}</p>
            </div>
          </div>
        </div>

        <nav className="mt-3 flex-1 space-y-1.5 p-4">
          {navItems.map((item) => {
            const isActive = isDashboardPathActive(pathname, item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                  isActive
                    ? "border border-blue-100 bg-blue-50 text-blue-900 font-semibold shadow-sm"
                    : "border border-transparent text-slate-600 hover:border-slate-100 hover:bg-slate-50 hover:text-blue-900"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isActive ? "bg-white text-blue-900 shadow-sm" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <i className={`fas ${item.icon} text-sm`} />
                </span>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-slate-200 p-4">
          <button
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-rose-600 transition-colors hover:bg-rose-50"
          >
            <i className="fas fa-sign-out-alt w-5 text-center" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
