"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RELATIONSHIP_MANAGER_ROLE, normalizeRole } from "@/lib/auth/redirects";
import { clearStoredAuth } from "@/lib/auth/storage";
import { useStoredUser } from "@/lib/auth/hooks";

type RoleShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  theme?: "default" | "admin";
};

export function RoleShell({
  title,
  subtitle,
  children,
  theme = "default",
}: RoleShellProps) {
  const router = useRouter();
  const user = useStoredUser();
  const displayRole =
    normalizeRole(user?.role) === RELATIONSHIP_MANAGER_ROLE
      ? "Relationship Manager"
      : String(user?.role ?? "user").replace(/_/g, " ");

  const handleLogout = async () => {
    await clearStoredAuth();
    router.push("/login");
  };

  return (
    <div className={`${theme === "admin" ? "admin-theme" : ""} min-h-screen overflow-x-clip bg-slate-50`}>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="rounded-2xl bg-slate-50 px-3 py-2 shadow-sm">
              <Image
                src="/assets/images/logo.png"
                alt="DoorstepFilings"
                width={124}
                height={48}
                className="h-11 w-auto object-contain"
                style={{ width: "auto" }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Protected Workspace
              </p>
              <h1 className="break-words text-xl font-black text-slate-900 sm:text-2xl">{title}</h1>
              <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
            <Link
              href="/account"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-50 sm:px-4 sm:tracking-[0.18em]"
            >
              <i className="fas fa-user text-[10px]" />
              Account
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-50 sm:px-4 sm:tracking-[0.18em]"
            >
              <i className="fas fa-house text-[10px]" />
              Home
            </Link>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-700 sm:px-4 sm:tracking-[0.18em]">
              {displayRole}
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-slate-800 sm:px-4 sm:tracking-[0.18em]"
            >
              <i className="fas fa-right-from-bracket text-[10px]" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto min-w-0 px-3 py-6 sm:px-4 sm:py-10">{children}</main>
    </div>
  );
}
