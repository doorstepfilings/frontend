"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { normalizeRole } from "@/lib/auth/redirects";
import { getDefaultRedirectPath } from "@/lib/auth/storage";
import { useAuthStatus, useStoredToken, useStoredUser } from "@/lib/auth/hooks";
import { GlobalLogoLoader } from "@/components/ui/logo-loader";

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
    return <GlobalLogoLoader label="Preparing your secure workspace..." />;
  }

  return <>{children}</>;
}
