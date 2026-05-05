type RedirectUser = {
  role?: string | null;
} | null | undefined;

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isUserPanelPath(pathname: string) {
  return matchesPrefix(pathname, "/dashboard") || matchesPrefix(pathname, "/account");
}

export function normalizeRole(role: string | null | undefined) {
  if (role === "admin") {
    return "super_admin";
  }

  if (role === "rm") {
    return "regional_manager";
  }

  return role ?? "user";
}

export function getDefaultRedirectPath(user: RedirectUser) {
  const role = normalizeRole(user?.role);

  if (role === "super_admin") {
    return "/admin/dashboard";
  }

  if (role === "accountant") {
    return "/accountant/dashboard";
  }

  if (role === "regional_manager") {
    return "/rm/dashboard";
  }

  return "/dashboard";
}

export function getAuthorizedRedirectPath(
  user: RedirectUser,
  requestedPath: string | null | undefined,
) {
  const role = normalizeRole(user?.role);
  const defaultPath = getDefaultRedirectPath(user);

  if (!requestedPath || requestedPath === "/login" || requestedPath === "/register") {
    return defaultPath;
  }

  if (role === "super_admin") {
    if (
      isUserPanelPath(requestedPath) ||
      matchesPrefix(requestedPath, "/rm") ||
      matchesPrefix(requestedPath, "/accountant")
    ) {
      return defaultPath;
    }

    return requestedPath;
  }

  if (role === "regional_manager") {
    if (
      isUserPanelPath(requestedPath) ||
      matchesPrefix(requestedPath, "/admin") ||
      matchesPrefix(requestedPath, "/accountant")
    ) {
      return defaultPath;
    }

    return requestedPath;
  }

  if (role === "accountant") {
    if (
      isUserPanelPath(requestedPath) ||
      matchesPrefix(requestedPath, "/admin") ||
      matchesPrefix(requestedPath, "/rm")
    ) {
      return defaultPath;
    }

    return requestedPath;
  }

  if (
    matchesPrefix(requestedPath, "/admin") ||
    matchesPrefix(requestedPath, "/rm") ||
    matchesPrefix(requestedPath, "/accountant")
  ) {
    return defaultPath;
  }

  return requestedPath;
}
