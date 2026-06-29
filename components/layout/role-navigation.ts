import { normalizeRole } from "@/lib/auth/redirects";

export type DashboardNavItem = {
  path: string;
  label: string;
  icon: string;
  section?: string;
};

export function getDashboardNavItems(roleInput?: string | null) {
  const role = normalizeRole(roleInput);

  if (role === "regional_manager") {
    return [
      { path: "/rm/dashboard", label: "Dashboard", icon: "fa-th-large", section: "Workspace" },
      { path: "/rm/assigned-users", label: "Assigned Users", icon: "fa-users", section: "Operations" },
      { path: "/rm/service-requests", label: "Service Requests", icon: "fa-layer-group", section: "Operations" },
    ] satisfies DashboardNavItem[];
  }

  if (role === "accountant") {
    return [
      { path: "/accountant/dashboard", label: "Dashboard", icon: "fa-th-large", section: "Workspace" },
      { path: "/accountant/assigned-users", label: "Clients", icon: "fa-users", section: "Operations" },
      { path: "/accountant/service-requests", label: "Services", icon: "fa-clipboard-list", section: "Operations" },
    ] satisfies DashboardNavItem[];
  }

  return [
    { path: "/admin/dashboard", label: "Dashboard", icon: "fa-th-large", section: "Overview" },
    { path: "/admin/users", label: "Users", icon: "fa-users", section: "People" },
    { path: "/admin/relationship-managers", label: "Relationship Managers", icon: "fa-user-tie", section: "People" },
    { path: "/admin/accountants", label: "Accountants", icon: "fa-calculator", section: "People" },
    { path: "/admin/categories", label: "Categories", icon: "fa-folder", section: "Catalog" },
    { path: "/admin/services", label: "Services", icon: "fa-briefcase", section: "Catalog" },
    { path: "/admin/enquiries", label: "Enquiries", icon: "fa-envelope-open", section: "Operations" },
    { path: "/admin/service-applications", label: "Applications", icon: "fa-clipboard-check", section: "Operations" },
  ] satisfies DashboardNavItem[];
}

export function isDashboardPathActive(pathname: string, path: string) {
  if (path.endsWith("/dashboard")) {
    return pathname === path;
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

export function getActiveDashboardItem(
  pathname: string,
  navItems: DashboardNavItem[],
) {
  return (
    [...navItems]
      .sort((left, right) => right.path.length - left.path.length)
      .find((item) => isDashboardPathActive(pathname, item.path)) ?? navItems[0]
  );
}

export function getRolePortalMeta(roleInput?: string | null) {
  const role = normalizeRole(roleInput);

  if (role === "regional_manager") {
    return {
      sectionLabel: "Relationship Manager Dashboard",
      headerLabel: "Operations Hub",
      actionHref: null,
      actionLabel: null,
      roleTag: "relationship manager",
    };
  }

  if (role === "accountant") {
    return {
      sectionLabel: "Accountant Portal",
      headerLabel: "Service Delivery Desk",
      actionHref: null,
      actionLabel: null,
      roleTag: "accountant",
    };
  }

  return {
    sectionLabel: "Admin Panel",
    headerLabel: "Command Center",
    actionHref: null,
    actionLabel: null,
    roleTag: "super admin",
  };
}
