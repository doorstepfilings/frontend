"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { normalizeRole } from "@/lib/auth/redirects";
import { getDefaultRedirectPath } from "@/lib/auth/storage";
import { useAuthStatus, useStoredToken, useStoredUser } from "@/lib/auth/hooks";

type AuthGuardProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

export function AuthGuard({
  children,
  allowedRoles = [],
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const authStatus = useAuthStatus();
  const token = useStoredToken();
  const user = useStoredUser();
  const normalizedAllowedRoles = allowedRoles.map((role) => normalizeRole(role));
  const roleKey = normalizedAllowedRoles.join("|");
  const hasAuth = Boolean(token && user);
  const normalizedUserRole = normalizeRole(
    typeof user?.role === "string" ? user.role : null,
  );
  const hasRole =
    !user || normalizedAllowedRoles.length === 0
      ? true
      : normalizedAllowedRoles.includes(normalizedUserRole);

  useEffect(() => {
    if (authStatus === "loading") {
      return;
    }

    if (!hasAuth) {
      const redirectTarget = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${redirectTarget}`);
      return;
    }

    if (!hasRole) {
      router.replace(getDefaultRedirectPath(user));
      return;
    }
  }, [authStatus, hasAuth, hasRole, pathname, roleKey, router, user]);

  if (authStatus === "loading" || !hasAuth || !hasRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <i className="fas fa-shield-halved" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-900">
            Preparing your secure workspace...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
