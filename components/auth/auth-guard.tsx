"use client";

import { useEffect } from "react";
import {useRouter } from "next/navigation";
import { normalizeRole } from "@/lib/auth/redirects";
import { getDefaultRedirectPath } from "@/lib/auth/storage";
import { useAuthStatus,
  useSessionExpiryRedirecting,
  useStoredToken,
  useStoredUser,
} from "@/lib/auth/hooks";
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
  const authStatus = useAuthStatus();
  const isSessionExpiryRedirecting = useSessionExpiryRedirecting();
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
    if (authStatus === "loading" || isSessionExpiryRedirecting) {
      return;
    }

    if (!hasAuth) {
      router.replace("/");
      return;
    }

    if (!hasRole) {
      router.replace(getDefaultRedirectPath(user));
      return;
    }
  }, [
    authStatus,
    hasAuth,
    hasRole,
    isSessionExpiryRedirecting,
    roleKey,
    router,
    user,
  ]);

  if (
    authStatus === "loading" ||
    isSessionExpiryRedirecting ||
    !hasAuth ||
    !hasRole
  ) {
    return <GlobalLogoLoader label="Preparing your secure workspace..." />;
  }

  return <>{children}</>;
}
