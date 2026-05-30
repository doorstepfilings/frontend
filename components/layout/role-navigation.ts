import { normalizeRole } from "@/lib/auth/redirects";

export type DashboardNavItem = {
  path: string;
  label: string;
  icon: string;
};

export function getDashboardNavItems(roleInput?: string | null) {
  const role = normalizeRole(roleInput);

  if (role === "regional_manager") {
    return [
      { path: "/rm/dashboard", label: "Dashboard", icon: "fa-th-large" },
      { path: "/rm/assigned-users", label: "Assigned Users", icon: "fa-users" },
      { path: "/rm/service-requests", label: "Service Requests", icon: "fa-layer-group" },
    ] satisfies DashboardNavItem[];
  }

  if (role === "accountant") {
    return [
      { path: "/accountant/dashboard", label: "Dashboard", icon: "fa-th-large" },
      { path: "/accountant/assigned-users", label: "Clients", icon: "fa-users" },
      { path: "/accountant/service-requests", label: "Services", icon: "fa-clipboard-list" },
      { path: "/accountant/documents", label: "Documents", icon: "fa-folder" },
    ] satisfies DashboardNavItem[];
  }

  return [
    { path: "/admin/dashboard", label: "Dashboard", icon: "fa-th-large" },
    { path: "/admin/users", label: "Users", icon: "fa-users" },
    { path: "/admin/relationship-managers", label: "Relationship Managers", icon: "fa-user-tie" },
    { path: "/admin/accountants", label: "Accountants", icon: "fa-calculator" },
    { path: "/admin/categories", label: "Categories", icon: "fa-folder" },
    { path: "/admin/services", label: "Services", icon: "fa-briefcase" },
    { path: "/admin/stages", label: "Milestones", icon: "fa-diagram-project" },
    { path: "/admin/enquiries", label: "Contact Enquiries", icon: "fa-envelope-open" },
    { path: "/admin/service-applications", label: "Applications", icon: "fa-clipboard-check" },
  ] satisfies DashboardNavItem[];
}

export function isDashboardPathActive(pathname: string, path: string) {
  if (path.endsWith("/dashboard")) {
    return pathname === path;
  }

  return pathname.startsWith(path);
}

export function getActiveDashboardItem(
  pathname: string,
  navItems: DashboardNavItem[],
) {
  return navItems.find((item) => isDashboardPathActive(pathname, item.path)) ?? navItems[0];
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
    sectionLabel: "Control Center",
    headerLabel: "Administration Workspace",
    actionHref: "/admin/services/create",
    actionLabel: "Add Service",
    roleTag: "super admin",
  };
}
