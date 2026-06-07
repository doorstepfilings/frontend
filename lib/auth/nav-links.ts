export interface NavLinkItem {
  href: string;
  label: string;
  icon: string;
  iconBg: string;
  hoverBg: string;
  hoverText: string;
}

interface RoleFlags {
  isSuperAdmin: boolean;
  isRegionalManager: boolean;
  isAccountant: boolean;
  showUserPanelLinks: boolean;
  dashboardHref: string;
}

/**
 * Returns the set of role-aware dashboard navigation links for the current
 * user. Used by both the desktop user-dropdown and the mobile menu to avoid
 * duplicating the same JSX in two places.
 */
export function getRoleNavLinks(flags: RoleFlags): NavLinkItem[] {
  const {
    isSuperAdmin,
    isRegionalManager,
    isAccountant,
    showUserPanelLinks,
    dashboardHref,
  } = flags;

  const links: NavLinkItem[] = [];

  if (isSuperAdmin) {
    links.push({
      href: dashboardHref,
      label: "Admin Dashboard",
      icon: "fa-chart-line",
      iconBg: "bg-blue-100",
      hoverBg: "hover:bg-blue-50",
      hoverText: "hover:text-blue-900",
    });
  }

  if (isAccountant) {
    links.push({
      href: dashboardHref,
      label: "Accountant Dashboard",
      icon: "fa-calculator",
      iconBg: "bg-emerald-100",
      hoverBg: "hover:bg-emerald-50",
      hoverText: "hover:text-emerald-900",
    });
  }

  if (isRegionalManager) {
    links.push({
      href: dashboardHref,
      label: "RM Dashboard",
      icon: "fa-user-tie",
      iconBg: "bg-indigo-100",
      hoverBg: "hover:bg-indigo-50",
      hoverText: "hover:text-indigo-900",
    });
  }

  if (showUserPanelLinks) {
    links.push(
      {
        href: "/dashboard",
        label: "My Dashboard",
        icon: "fa-th-large",
        iconBg: "bg-blue-100",
        hoverBg: "hover:bg-blue-50",
        hoverText: "hover:text-blue-900",
      },
      {
        href: "/dashboard/services",
        label: "My Services",
        icon: "fa-clipboard-list",
        iconBg: "bg-amber-100",
        hoverBg: "hover:bg-blue-50",
        hoverText: "hover:text-blue-900",
      },
      {
        href: "/account",
        label: "My Account",
        icon: "fa-user",
        iconBg: "bg-blue-100",
        hoverBg: "hover:bg-blue-50",
        hoverText: "hover:text-blue-900",
      },
    );
  }

  return links;
}
