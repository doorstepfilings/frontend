type RedirectUser = {
  role?: string | null;
} | null | undefined;

export const RELATIONSHIP_MANAGER_ROLE = "relationship_manager";
const RELATIONSHIP_MANAGER_ROLE_ALIASES = new Set([
  "rm",
  "regional_manager",
  RELATIONSHIP_MANAGER_ROLE,
]);

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isUserPanelPath(pathname: string) {
  return matchesPrefix(pathname, "/dashboard") || matchesPrefix(pathname, "/account");
}

export function normalizeRole(role: string | null | undefined) {
  const normalizedRole = String(role ?? "").trim().toLowerCase();

  if (!normalizedRole) {
    return "user";
  }

  if (normalizedRole === "admin") {
    return "super_admin";
  }

  if (isRelationshipManagerRole(normalizedRole)) {
    return RELATIONSHIP_MANAGER_ROLE;
  }

  return normalizedRole;
}

export function isRelationshipManagerRole(role: string | null | undefined) {
  return RELATIONSHIP_MANAGER_ROLE_ALIASES.has(
    String(role ?? "").trim().toLowerCase(),
  );
}

export function getBackendRole(role: string | null | undefined) {
  const rawRole = String(role ?? "").trim().toLowerCase();

  if (!rawRole) {
    return "user";
  }

  if (isRelationshipManagerRole(rawRole)) {
    return "regional_manager";
  }

  return rawRole;
}

export function getDefaultRedirectPath(user: RedirectUser) {
  const role = normalizeRole(user?.role);

  if (role === "super_admin") {
    return "/admin/dashboard";
  }

  if (role === "accountant") {
    return "/accountant/dashboard";
  }

  if (role === RELATIONSHIP_MANAGER_ROLE) {
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

  if (role === RELATIONSHIP_MANAGER_ROLE) {
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
